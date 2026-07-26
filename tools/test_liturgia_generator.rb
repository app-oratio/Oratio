#!/usr/bin/env ruby
# frozen_string_literal: true

require "fileutils"
require "json"
require "minitest/autorun"
require "tmpdir"

module Jekyll
  class PageWithoutAFile
    attr_accessor :data, :content, :dir, :name

    def initialize(_site, _base, dir, name)
      @dir = dir
      @name = name
      @data = {}
      @content = ""
    end
  end

  class Generator
    def self.safe(*) = nil
    def self.priority(*) = nil
  end

  class NullLogger
    def warn(*) = nil
  end

  def self.logger = (@logger ||= NullLogger.new)
end

require_relative "../_plugins/liturgia_generator"

class LiturgiaGeneratorTest < Minitest::Test
  FakeSite = Struct.new(:source, :config, :pages, :data)

  def setup
    @tmp = Dir.mktmpdir("oratio-liturgia")
    @day = File.join(@tmp, "content/liturgia/2026/07/25")
    FileUtils.mkdir_p(@day)

    File.write(File.join(@day, "liturgia-info.json"), JSON.pretty_generate({
      "tempoLiturgico" => "TC",
      "diaSemana" => "Sab",
      "corLiturgica" => "R",
      "semanaSalterio" => 4,
      "semana" => "16.0",
      "anoABC" => "Ano A",
      "primeirasVesp" => "T",
      "tipoMemoria" => "F"
    }))

    metadata = Oratio::Liturgia::HOUR_ORDER.map do |slug|
      {
        "hora" => slug,
        "hora-title" => Oratio::Liturgia::HOUR_DEFAULTS.fetch(slug),
        "titulo" => "#{Oratio::Liturgia::HOUR_DEFAULTS.fetch(slug)} da Festa de São Tiago",
        "capa" => (slug == "laudes" ? "/assets/images/liturgia/laudes-teste.webp" : "/assets/images/liturgia/r.png")
      }
    end
    File.write(File.join(@day, "horas-info.json"), JSON.pretty_generate(metadata))
    File.write(File.join(@day, "liturgy.json"), JSON.pretty_generate([
      { "title" => "Primeira leitura", "html" => "<p>Texto da leitura.</p>" }
    ]))

    Oratio::Liturgia::HOUR_ORDER.each do |slug|
      File.write(File.join(@day, "#{slug}.html"), <<~HTML)
        <h1>#{Oratio::Liturgia::HOUR_DEFAULTS.fetch(slug)} da Festa de São Tiago</h1><hr><hr>
        <h2><br>Hino</h2>
        <p onclick="Android.showDialog('Pai Nosso')">Texto</p>
        <script>Android.atualizarLatim();</script>
      HTML
    end
    File.write(File.join(@day, "invitatorio.html"), '<p><span style="color: red">℟.</span> Vinde, adoremos o Senhor.</p>')
  end

  def teardown
    FileUtils.remove_entry(@tmp)
  end

  def test_generates_all_public_pages_and_normalizes_legacy_html
    site = FakeSite.new(@tmp, { "liturgia" => { "source" => "content/liturgia" } }, [], {})
    Oratio::Liturgia::Generator.new.generate(site)

    assert_equal 12, site.pages.length
    hour_page = site.pages.find { |page| page.dir.end_with?("/laudes") }
    refute_nil hour_page
    refute_includes hour_page.content, "<script"
    refute_includes hour_page.content, "Android."
    refute_includes hour_page.content, "<h1"
    assert_equal "Liturgia das Horas", hour_page.data.dig("breadcrumb_parent", "label")
    assert_equal "/assets/images/liturgia/laudes-teste.webp", hour_page.data["image"]

    daily_page = site.pages.find { |page| page.dir == "liturgia/2026/07/25" }
    assert_equal "Vermelho", daily_page.data.dig("liturgical", "color_label")
    assert_equal "4ª semana do Saltério", daily_page.data.dig("liturgical", "psalter_label")
    assert_equal "Festa", daily_page.data.dig("liturgical", "rank_label")
    assert_equal [], daily_page.data.dig("liturgical", "observances")
    assert_equal "/assets/images/liturgia/laudes-teste.webp", daily_page.data["image"]

    daily_index = site.pages.find { |page| page.dir == "liturgia" }
    assert_equal "/assets/images/liturgia/laudes-teste.webp", daily_index.data["image"]
    assert_equal 7, daily_index.data.dig("featured_day", "hour_cards").length

    assert_acyclic(site.pages.map(&:data))

    invitatory_page = site.pages.find { |page| page.dir.end_with?("/invitatorio") }
    assert_equal "Vinde, adoremos o Senhor.", invitatory_page.data["invitatory_antiphon"]
  end

  def test_language_panels_survive_normalization_without_legacy_script
    generator = Oratio::Liturgia::Generator.new
    raw = <<~HTML
      <h1>Laudes</h1><hr>
      <span id="cantEvangBtnPt">Português</span>
      <span id="cantEvangBtnLat">Latim</span>
      <div id="cantEvangPt">Benedictus</div>
      <div id="cantEvangLat" style="display: none;">Benedíctus</div>
      <script>Android.atualizarLatim();</script>
    HTML

    normalized = generator.send(:normalize_fragment, raw, strip_title: true)
    assert_includes normalized, 'id="cantEvangBtnLat"'
    assert_includes normalized, 'id="cantEvangLat"'
    assert_includes normalized, 'style="display: none;"'
    refute_includes normalized, '<script'
    refute_includes normalized, 'Android.'
  end

  def test_optional_memorial_codes_remain_distinct
    generator = Oratio::Liturgia::Generator.new

    %w[m m*].each do |code|
      info = generator.send(:normalize_liturgical_info, {
        "corLiturgica" => "G",
        "tipoMemoria" => code,
        "primeirasVesp" => "T"
      })
      assert_equal code, info["rank_code"]
      assert_equal "Memória facultativa", info["rank_label"]
      refute_includes info["observances"], "Primeiras Vésperas"
    end
  end

  private

  def assert_acyclic(value, active = {}, path = "root")
    return unless value.is_a?(Hash) || value.is_a?(Array)

    object_id = value.object_id
    flunk("Referência circular encontrada em #{path}") if active[object_id]
    active[object_id] = true

    if value.is_a?(Hash)
      value.each { |key, child| assert_acyclic(child, active, "#{path}.#{key}") }
    else
      value.each_with_index { |child, index| assert_acyclic(child, active, "#{path}[#{index}]") }
    end
  ensure
    active.delete(object_id) if object_id
  end

end
