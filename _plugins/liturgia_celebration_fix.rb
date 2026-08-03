# frozen_string_literal: true

require "json"

module Oratio
  module Liturgia
    module FerialCelebrationFix
      WEEKDAY_MAP = {
        "Dom" => "Domingo",
        "Seg" => "Segunda-feira",
        "Ter" => "Terça-feira",
        "Qua" => "Quarta-feira",
        "Qui" => "Quinta-feira",
        "Sex" => "Sexta-feira",
        "Sab" => "Sábado"
      }.freeze

      private

      def infer_celebration(hours)
        inferred = super
        return inferred unless inferred.match?(/\b\d+ª\s+semana\s+do\s+Saltério\b/i)

        info = read_liturgical_info_for(hours)
        ferial_celebration(info) || inferred
      end

      def read_liturgical_info_for(hours)
        preferred = hours.find { |hour| hour["slug"] == "laudes" } || hours.first
        return nil unless preferred

        source_path = preferred["source_path"].to_s
        return nil if source_path.empty?

        info_path = File.join(File.dirname(source_path), "liturgia-info.json")
        return nil unless File.file?(info_path)

        parsed = JSON.parse(File.read(info_path, encoding: "UTF-8"))
        parsed.is_a?(Hash) ? parsed : nil
      rescue JSON::ParserError, SystemCallError
        nil
      end

      def ferial_celebration(info)
        return nil unless info.is_a?(Hash)
        return nil if truthy_liturgical_value?(info["isMemoria"])

        rank_code = info["tipoMemoria"].to_s.strip
        return nil unless rank_code.empty? || rank_code.casecmp("FE").zero?

        weekday = WEEKDAY_MAP.fetch(info["diaSemana"].to_s, info["diaSemana"].to_s).strip
        return nil if weekday.empty? || weekday == "Domingo"

        week_number = info["semana"].to_s.sub(/\.0\z/, "").strip
        season = season_complement(info["tempoLiturgico"])
        return nil if week_number.empty? || season.nil?

        "#{weekday} da #{week_number}ª semana #{season}"
      end

      def season_complement(code)
        case code.to_s.upcase
        when "TC" then "do Tempo Comum"
        when "TA", "ADV" then "do Advento"
        when "TN", "N" then "do Natal"
        when "TQ", "Q" then "da Quaresma"
        when "TP", "P" then "da Páscoa"
        end
      end

      def truthy_liturgical_value?(value)
        value == true || %w[true t sim s 1].include?(value.to_s.strip.downcase)
      end
    end
  end
end

Jekyll::Hooks.register :site, :post_read do
  generator = Oratio::Liturgia::Generator
  fix = Oratio::Liturgia::FerialCelebrationFix
  generator.prepend(fix) unless generator.ancestors.include?(fix)
end
