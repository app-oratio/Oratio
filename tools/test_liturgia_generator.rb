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
        "capa" => "/assets/images/liturgia/r.png"
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


  def assert_acyclic(value, ancestors = {})
    return unless value.is_a?(Hash) || value.is_a?(Array)

    object_id = value.object_id
    refute ancestors.key?(object_id), "referência circular encontrada nos dados da página"

    next_ancestors = ancestors.merge(object_id => true)
    if value.is_a?(Hash)
      value.each_value { |child| assert_acyclic(child, next_ancestors) }
    else
      value.each { |child| assert_acyclic(child, next_ancestors) }
    end
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
    assert_equal "/assets/images/liturgia/r.png", hour_page.data["image"]

    daily_page = site.pages.find { |page| page.dir == "liturgia/2026/07/25" }
    assert_equal "Vermelho", daily_page.data.dig("liturgical", "color_label")
    assert_equal "4ª semana do Saltério", daily_page.data.dig("liturgical", "psalter_label")

    invitatory_page = site.pages.find { |page| page.dir.end_with?("/invitatorio") }
    assert_equal "Vinde, adoremos o Senhor.", invitatory_page.data["invitatory_antiphon"]

    site.pages.each { |page| assert_acyclic(page.data) }
    refute daily_page.data.fetch("hours").first.key?("source_path")
    assert_equal({
      "slug" => "oficio-das-leituras",
      "short_title" => "Ofício das Leituras",
      "title" => "Ofício das Leituras da Festa de São Tiago",
      "url" => "/liturgia-das-horas/2026/07/25/oficio-das-leituras/"
    }, hour_page.data["previous_hour"])
  end
end
