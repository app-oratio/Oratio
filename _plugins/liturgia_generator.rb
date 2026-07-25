# frozen_string_literal: true

require "cgi"
require "date"
require "json"

module Oratio
  module Liturgia
    HOUR_ORDER = %w[
      oficio-das-leituras
      laudes
      hora-terca
      hora-sexta
      hora-nona
      vesperas
      completas
    ].freeze

    HOUR_DEFAULTS = {
      "oficio-das-leituras" => "Ofício das Leituras",
      "laudes" => "Laudes",
      "hora-terca" => "Hora Terça",
      "hora-sexta" => "Hora Sexta",
      "hora-nona" => "Hora Nona",
      "vesperas" => "Vésperas",
      "completas" => "Completas"
    }.freeze

    COLOR_MAP = {
      "R" => { "label" => "Vermelho", "hex" => "#9D2020", "on" => "#FFFFFF" },
      "P" => { "label" => "Roxo", "hex" => "#67507A", "on" => "#FFFFFF" },
      "PP" => { "label" => "Roxo ou rosa", "hex" => "#67507A", "on" => "#FFFFFF" },
      "G" => { "label" => "Verde", "hex" => "#287A45", "on" => "#FFFFFF" },
      "W" => { "label" => "Branco", "hex" => "#F7F4EC", "on" => "#1C1B1F" },
      "PWB" => { "label" => "Roxo, branco ou preto", "hex" => "#67507A", "on" => "#FFFFFF" }
    }.freeze

    SEASON_MAP = {
      "TA" => "Tempo do Advento",
      "ADV" => "Tempo do Advento",
      "TN" => "Tempo do Natal",
      "N" => "Tempo do Natal",
      "TQ" => "Tempo da Quaresma",
      "Q" => "Tempo da Quaresma",
      "TP" => "Tempo Pascal",
      "P" => "Tempo Pascal",
      "TC" => "Tempo Comum"
    }.freeze

    WEEKDAY_MAP = {
      "Dom" => "Domingo",
      "Seg" => "Segunda-feira",
      "Ter" => "Terça-feira",
      "Qua" => "Quarta-feira",
      "Qui" => "Quinta-feira",
      "Sex" => "Sexta-feira",
      "Sab" => "Sábado"
    }.freeze

    RANK_MAP = {
      "S" => "Solenidade",
      "F" => "Festa",
      "M" => "Memória",
      "MO" => "Memória obrigatória",
      "ML" => "Memória facultativa",
      "MF" => "Memória facultativa",
      "FE" => "Féria"
    }.freeze

    MONTHS = %w[
      janeiro fevereiro março abril maio junho
      julho agosto setembro outubro novembro dezembro
    ].freeze

    WEEKDAYS = %w[
      domingo segunda-feira terça-feira quarta-feira
      quinta-feira sexta-feira sábado
    ].freeze

    class GeneratedPage < Jekyll::PageWithoutAFile
      def initialize(site, dir, data, content = "")
        super(site, site.source, dir, "index.html")
        self.data = data
        self.content = content
      end
    end

    class Generator < Jekyll::Generator
      safe true
      priority :low

      def generate(site)
        config = site.config.fetch("liturgia", {})
        source_dir = config.fetch("source", "content/liturgia")
        root = File.join(site.source, source_dir)
        return unless Dir.exist?(root)

        days = discover_days(site, root)
        return if days.empty?

        connect_days(days)
        available_days = build_available_days(days)
        site.data["liturgia_days"] = available_days

        days.each do |day|
          generate_daily_page(site, day, available_days)
          generate_hours_day_page(site, day, available_days)
          generate_hour_pages(site, day, available_days)
          generate_invitatory_page(site, day, available_days)
        end

        generate_index_page(site, days, available_days, "daily")
        generate_index_page(site, days, available_days, "hours")
      end

      private

      def discover_days(site, root)
        pattern = File.join(root, "[0-9][0-9][0-9][0-9]", "[0-9][0-9]", "[0-9][0-9]")
        Dir.glob(pattern).sort.filter_map do |directory|
          parse_day(site, directory)
        rescue StandardError => error
          Jekyll.logger.warn("Liturgia:", "não foi possível processar #{directory}: #{error.message}")
          nil
        end
      end

      def parse_day(site, directory)
        relative = directory.delete_prefix(File.join(site.source, site.config.dig("liturgia", "source") || "content/liturgia") + File::SEPARATOR)
        year, month, day = relative.split(File::SEPARATOR).map(&:to_i)
        date = Date.new(year, month, day)

        info = read_json(File.join(directory, "liturgia-info.json"), {})
        hour_metadata = read_json(File.join(directory, "horas-info.json"), [])
        mass_sections = read_json(File.join(directory, "liturgy.json"), [])
        return nil unless info.is_a?(Hash) && hour_metadata.is_a?(Array) && mass_sections.is_a?(Array)

        normalized_info = normalize_liturgical_info(info)
        hours = build_hours(directory, date, hour_metadata, normalized_info)
        celebration = infer_celebration(hours)
        invitatory_path = File.join(directory, "invitatorio.html")

        {
          "date" => date,
          "date_iso" => date.iso8601,
          "date_long" => format_long_date(date),
          "date_short" => format_short_date(date),
          "directory" => directory,
          "celebration" => celebration,
          "liturgical" => normalized_info,
          "mass_sections" => normalize_mass_sections(mass_sections),
          "hours" => hours,
          "invitatory_exists" => File.file?(invitatory_path),
          "invitatory_path" => invitatory_path,
          "daily_url" => "/liturgia/#{date.strftime('%Y/%m/%d')}/",
          "hours_url" => "/liturgia-das-horas/#{date.strftime('%Y/%m/%d')}/"
        }
      end

      def read_json(path, fallback)
        unless File.file?(path)
          Jekyll.logger.warn("Liturgia:", "arquivo ausente: #{path}")
          return fallback
        end

        JSON.parse(File.read(path, encoding: "UTF-8"))
      rescue JSON::ParserError => error
        Jekyll.logger.warn("Liturgia:", "JSON inválido em #{path}: #{error.message}")
        fallback
      end

      def normalize_liturgical_info(info)
        code = info.fetch("corLiturgica", "W").to_s.upcase
        color = COLOR_MAP.fetch(code, COLOR_MAP["W"])
        week_number = info["semana"].to_s.sub(/\.0\z/, "")
        psalter_week = integer_or_nil(info["semanaSalterio"])
        rank_code = info["tipoMemoria"].to_s.upcase

        observances = []
        observances << "Primeiras Vésperas" if truthy?(info["primeirasVesp"])
        observances << "Dia de jejum" if truthy?(info["isJejum"])
        observances << "Dia de abstinência" if truthy?(info["isAbstinencia"])

        {
          "color_code" => code,
          "color_label" => color["label"],
          "color_hex" => color["hex"],
          "color_on" => color["on"],
          "color_image" => "/assets/images/liturgia/#{code.downcase}.png",
          "season_code" => info["tempoLiturgico"].to_s,
          "season_label" => SEASON_MAP.fetch(info["tempoLiturgico"].to_s.upcase, info["tempoLiturgico"].to_s),
          "weekday_label" => WEEKDAY_MAP.fetch(info["diaSemana"].to_s, info["diaSemana"].to_s),
          "rank_code" => rank_code,
          "rank_label" => RANK_MAP.fetch(rank_code, rank_code),
          "is_memorial" => truthy?(info["isMemoria"]),
          "year_cycle" => info["anoABC"].to_s,
          "week_number" => week_number,
          "week_label" => week_number.empty? ? nil : "#{ordinal(week_number)} semana",
          "psalter_week" => psalter_week,
          "psalter_label" => psalter_week ? "#{ordinal(psalter_week)} semana do Saltério" : nil,
          "first_vespers" => truthy?(info["primeirasVesp"]),
          "fast" => truthy?(info["isJejum"]),
          "abstinence" => truthy?(info["isAbstinencia"]),
          "observances" => observances,
          "raw" => info
        }
      end

      def build_hours(directory, date, metadata, liturgical)
        metadata_by_slug = metadata.each_with_object({}) do |item, result|
          next unless item.is_a?(Hash)

          slug = item["hora"].to_s
          result[slug] = item unless slug.empty?
        end

        HOUR_ORDER.filter_map do |slug|
          path = File.join(directory, "#{slug}.html")
          next unless File.file?(path)

          raw = File.read(path, encoding: "UTF-8")
          meta = metadata_by_slug.fetch(slug, {})
          extracted_title = extract_title(raw)
          title = presence(meta["titulo"]) || extracted_title || HOUR_DEFAULTS.fetch(slug)
          short_title = presence(meta["hora-title"]) || HOUR_DEFAULTS.fetch(slug)
          cover = presence(meta["capa"]) || liturgical["color_image"]

          {
            "slug" => slug,
            "short_title" => short_title,
            "title" => title,
            "cover" => cover,
            "image_alt" => "#{short_title}, #{title}",
            "source_path" => path,
            "url" => "/liturgia-das-horas/#{date.strftime('%Y/%m/%d')}/#{slug}/"
          }
        end
      end

      def normalize_mass_sections(sections)
        sections.filter_map do |section|
          next unless section.is_a?(Hash)

          title = presence(section["title"])
          html = presence(section["html"])
          next unless title && html

          {
            "title" => title,
            "anchor" => slugify(title),
            "html" => normalize_fragment(html, strip_title: false)
          }
        end
      end

      def infer_celebration(hours)
        preferred = hours.find { |hour| hour["slug"] == "laudes" } || hours.first
        return "Liturgia do dia" unless preferred

        preferred["title"].sub(
          /\A(?:Ofício das Leituras|Laudes|Hora Terça|Hora Sexta|Hora Nona|Vésperas|Completas)\s+(?:d[aeo]|de)\s+/i,
          ""
        ).strip
      end

      def connect_days(days)
        days.each_with_index do |day, index|
          previous = index.positive? ? days[index - 1] : nil
          following = index < days.length - 1 ? days[index + 1] : nil
          day["previous_day"] = previous
          day["next_day"] = following

          day["hours"].each_with_index do |hour, hour_index|
            hour["previous_hour"] = hour_index.positive? ? day["hours"][hour_index - 1] : nil
            hour["next_hour"] = hour_index < day["hours"].length - 1 ? day["hours"][hour_index + 1] : nil
          end
        end
      end

      def build_available_days(days)
        days.map do |day|
          {
            "date" => day["date_iso"],
            "label" => day["date_long"],
            "celebration" => day["celebration"],
            "daily_url" => day["daily_url"],
            "hours_url" => day["hours_url"],
            "hours" => day["hours"].each_with_object({}) { |hour, result| result[hour["slug"]] = hour["url"] },
            "invitatory_url" => day["invitatory_exists"] ? invitatory_url(day["date"]) : nil
          }
        end
      end

      def generate_daily_page(site, day, available_days)
        page_data = common_page_data(day, available_days).merge(
          "layout" => "liturgy-day",
          "title" => "Liturgia diária: #{day['celebration']}",
          "description" => "Leituras e orações da liturgia diária de #{day['date_long']}, com informações do calendário litúrgico e acesso à Liturgia das Horas.",
          "search_type" => "Liturgia diária",
          "mass_sections" => day["mass_sections"],
          "hours" => day["hours"],
          "hours_day_url" => day["hours_url"],
          "breadcrumb_parent" => { "label" => "Liturgia diária", "url" => "/liturgia/" }
        )
        content = day["mass_sections"].map { |section| "#{section['title']} #{section['html']}" }.join("\n")
        site.pages << GeneratedPage.new(site, day["daily_url"].delete_prefix("/").delete_suffix("/"), page_data, content)
      end

      def generate_hours_day_page(site, day, available_days)
        page_data = common_page_data(day, available_days).merge(
          "layout" => "liturgy-hours-day",
          "title" => "Liturgia das Horas: #{day['celebration']}",
          "description" => "Ofício das Leituras, Laudes, Horas Menores, Vésperas e Completas de #{day['date_long']}.",
          "search_type" => "Liturgia das Horas",
          "hours" => day["hours"],
          "daily_page_url" => day["daily_url"],
          "invitatory_url" => day["invitatory_exists"] ? invitatory_url(day["date"]) : nil,
          "breadcrumb_parent" => { "label" => "Liturgia das Horas", "url" => "/liturgia-das-horas/" }
        )
        content = day["hours"].map { |hour| "#{hour['short_title']} #{hour['title']}" }.join("\n")
        site.pages << GeneratedPage.new(site, day["hours_url"].delete_prefix("/").delete_suffix("/"), page_data, content)
      end

      def generate_hour_pages(site, day, available_days)
        day["hours"].each do |hour|
          raw = File.read(hour["source_path"], encoding: "UTF-8")
          normalized = normalize_fragment(raw, strip_title: true)
          page_data = common_page_data(day, available_days).merge(
            "layout" => "liturgy-hour",
            "title" => hour["title"],
            "description" => "Reze #{hour['short_title']} de #{day['date_long']}: #{day['celebration']}.",
            "search_type" => "Liturgia das Horas",
            "image" => hour["cover"],
            "image_alt" => hour["image_alt"],
            "hour" => hour,
            "hour_slug" => hour["slug"],
            "hour_short_title" => hour["short_title"],
            "previous_hour" => hour["previous_hour"],
            "next_hour" => hour["next_hour"],
            "daily_page_url" => day["daily_url"],
            "hours_day_url" => day["hours_url"],
            "invitatory_url" => %w[oficio-das-leituras laudes].include?(hour["slug"]) && day["invitatory_exists"] ? invitatory_url(day["date"]) : nil,
            "breadcrumb_parent" => { "label" => "Liturgia das Horas", "url" => day["hours_url"] }
          )
          site.pages << GeneratedPage.new(site, hour["url"].delete_prefix("/").delete_suffix("/"), page_data, normalized)
        end
      end

      def generate_invitatory_page(site, day, available_days)
        return unless day["invitatory_exists"]

        raw = File.read(day["invitatory_path"], encoding: "UTF-8")
        antiphon = extract_invitatory_antiphon(raw)
        cover_hour = day["hours"].find { |hour| hour["slug"] == "oficio-das-leituras" } || day["hours"].find { |hour| hour["slug"] == "laudes" } || day["hours"].first
        page_data = common_page_data(day, available_days).merge(
          "layout" => "liturgy-invitatory",
          "title" => "Invitatório: #{day['celebration']}",
          "description" => "Invitatório de #{day['date_long']}, com os Salmos 94, 23, 66 e 99.",
          "search_type" => "Liturgia das Horas",
          "image" => cover_hour ? cover_hour["cover"] : day["liturgical"]["color_image"],
          "image_alt" => "Invitatório, #{day['celebration']}",
          "invitatory_antiphon" => antiphon,
          "oficio_url" => hour_url(day, "oficio-das-leituras"),
          "laudes_url" => hour_url(day, "laudes"),
          "hours_day_url" => day["hours_url"],
          "daily_page_url" => day["daily_url"],
          "breadcrumb_parent" => { "label" => "Liturgia das Horas", "url" => day["hours_url"] }
        )
        site.pages << GeneratedPage.new(site, invitatory_url(day["date"]).delete_prefix("/").delete_suffix("/"), page_data, normalize_fragment(raw, strip_title: true))
      end

      def generate_index_page(site, days, available_days, kind)
        featured = featured_day(days)
        daily = kind == "daily"
        data = {
          "layout" => "liturgy-index",
          "title" => daily ? "Liturgia diária" : "Liturgia das Horas",
          "description" => daily ? "Acompanhe a liturgia diária, as leituras da Missa e a Liturgia das Horas." : "Reze a Liturgia das Horas conforme o dia do calendário litúrgico.",
          "search_type" => daily ? "Liturgia diária" : "Liturgia das Horas",
          "liturgia_page" => true,
          "liturgy_index_kind" => kind,
          "featured_day" => available_days.find { |item| item["date"] == featured["date_iso"] },
          "available_days" => available_days,
          "image" => featured["liturgical"]["color_image"],
          "image_alt" => featured["liturgical"]["color_label"],
          "search" => true,
          "sitemap" => true
        }
        dir = daily ? "liturgia" : "liturgia-das-horas"
        site.pages << GeneratedPage.new(site, dir, data)
      end

      def common_page_data(day, available_days)
        {
          "liturgia_page" => true,
          "date" => day["date"],
          "date_iso" => day["date_iso"],
          "date_long" => day["date_long"],
          "date_short" => day["date_short"],
          "celebration" => day["celebration"],
          "liturgical" => day["liturgical"],
          "available_days" => available_days,
          "previous_day" => compact_day_link(day["previous_day"]),
          "next_day" => compact_day_link(day["next_day"]),
          "image" => day["liturgical"]["color_image"],
          "image_alt" => "Cor litúrgica #{day['liturgical']['color_label']}",
          "search" => true,
          "sitemap" => true
        }
      end

      def compact_day_link(day)
        return nil unless day

        {
          "date_iso" => day["date_iso"],
          "date_short" => day["date_short"],
          "daily_url" => day["daily_url"],
          "hours_url" => day["hours_url"]
        }
      end

      def featured_day(days)
        configured = ENV["ORATIO_TODAY"]
        today = configured ? Date.iso8601(configured) : Date.today
        days.find { |day| day["date"] == today } || days.reverse.find { |day| day["date"] <= today } || days.first
      rescue Date::Error
        days.last
      end

      def extract_title(raw)
        match = raw.match(/<h1\b[^>]*>(.*?)<\/h1\s*>/mi)
        match ? strip_html(match[1]) : nil
      end

      def extract_invitatory_antiphon(raw)
        clean = normalize_fragment(raw, strip_title: false)
        match = clean.match(/<span\b[^>]*>\s*Ant(?:\.|ífona)?\s*<\/span>\s*(.*?)<\/p\s*>/mi)
        return match[1].strip if match && !strip_html(match[1]).empty?

        match = clean.match(/<p\b[^>]*class=["'][^"']*ant[^"']*["'][^>]*>(.*?)<\/p\s*>/mi)
        return match[1].strip if match && !strip_html(match[1]).empty?

        match = clean.match(/<p\b[^>]*>\s*<span\b[^>]*>\s*[℟R]\.?\s*<\/span>\s*(.*?)<\/p\s*>/mi)
        return match[1].strip if match && !strip_html(match[1]).empty?

        Jekyll.logger.warn("Liturgia:", "antífona do Invitatório não identificada; verifique o arquivo do dia")
        "Antífona do dia não identificada no arquivo-fonte."
      end

      def normalize_fragment(raw, strip_title: false)
        html = raw.to_s.encode("UTF-8", invalid: :replace, undef: :replace, replace: "")
        html.gsub!(/<script\b[^>]*>.*?<\/script\s*>/mi, "")
        html.gsub!(/<h3\b[^>]*>.*?id=["']clickCompletasLatim["'].*?<\/h3\s*>\s*<hr\b[^>]*>/mi, "")
        html.gsub!(/\s+on\w+=(['"]).*?\1/mi, "")
        html.gsub!(/(?:href|src)=(['"])\s*javascript:.*?\1/mi, "")
        html.gsub!(/<[^>]+>/) { |tag| tag.gsub("&nbsp;", " ") }
        html.gsub!(/color\s*:\s*red\b/i, "color: var(--liturgical-red)")
        html.gsub!(/color\s*:\s*black\b/i, "color: var(--oratio-text-primary)")
        html.gsub!(/var\(--text-main\)/i, "var(--oratio-text-primary)")
        html.gsub!(/<(h[2-4])([^>]*)>\s*(?:<br\s*\/?\s*>\s*)+/i, '<\1\2>')
        html.gsub!(/>\s*-(?:i|ii)\s*</i, "><")
        html.gsub!(/\A\s*<h1\b[^>]*>.*?<\/h1\s*>\s*(?:<hr\b[^>]*>\s*){0,2}/mi, "") if strip_title
        html.strip
      end

      def hour_url(day, slug)
        hour = day["hours"].find { |item| item["slug"] == slug }
        hour && hour["url"]
      end

      def invitatory_url(date)
        "/liturgia-das-horas/#{date.strftime('%Y/%m/%d')}/invitatorio/"
      end

      def format_long_date(date)
        "#{WEEKDAYS[date.wday].capitalize}, #{date.day} de #{MONTHS[date.month - 1]} de #{date.year}"
      end

      def format_short_date(date)
        "#{date.day} de #{MONTHS[date.month - 1]}"
      end

      def truthy?(value)
        value == true || %w[true t sim s 1].include?(value.to_s.strip.downcase)
      end

      def integer_or_nil(value)
        Integer(value)
      rescue ArgumentError, TypeError
        nil
      end

      def ordinal(value)
        "#{value}ª"
      end

      def presence(value)
        text = value.to_s.strip
        text.empty? ? nil : text
      end

      def strip_html(value)
        CGI.unescapeHTML(value.to_s.gsub(/<[^>]*>/, " ").gsub(/\s+/, " ").strip)
      end

      def slugify(value)
        value.to_s
             .downcase
             .unicode_normalize(:nfkd)
             .gsub(/\p{Mn}/, "")
             .gsub(/[^a-z0-9]+/, "-")
             .gsub(/\A-|\z-/, "")
      end
    end
  end
end
