#!/usr/bin/env ruby
# frozen_string_literal: true

require "date"
require "json"
require "pathname"

ROOT = Pathname.new(ARGV[0] || "content/liturgia")
HOURS = %w[
  oficio-das-leituras
  laudes
  hora-terca
  hora-sexta
  hora-nona
  vesperas
  completas
].freeze
COLORS = %w[R P PP G W PWB].freeze

errors = []
warnings = []

def read_json(path, errors)
  JSON.parse(path.read(encoding: "UTF-8"))
rescue JSON::ParserError => error
  errors << "#{path}: JSON inválido: #{error.message}"
  nil
rescue Errno::ENOENT
  errors << "#{path}: arquivo obrigatório ausente"
  nil
end

unless ROOT.directory?
  warn "Diretório não encontrado: #{ROOT}"
  exit 1
end

directories = ROOT.glob("[0-9][0-9][0-9][0-9]/[0-9][0-9]/[0-9][0-9]").select(&:directory?).sort
if directories.empty?
  warn "Nenhum pacote diário encontrado em #{ROOT}"
  exit 1
end

directories.each do |directory|
  relative = directory.relative_path_from(ROOT).to_s
  begin
    Date.strptime(relative, "%Y/%m/%d")
  rescue Date::Error
    errors << "#{relative}: caminho não representa uma data válida"
    next
  end

  info = read_json(directory.join("liturgia-info.json"), errors)
  hours_info = read_json(directory.join("horas-info.json"), errors)
  mass = read_json(directory.join("liturgy.json"), errors)

  if info.is_a?(Hash)
    color = info["corLiturgica"].to_s.upcase
    errors << "#{relative}: corLiturgica ausente" if color.empty?
    warnings << "#{relative}: código de cor desconhecido #{color.inspect}" unless color.empty? || COLORS.include?(color)
    warnings << "#{relative}: tempoLiturgico ausente" if info["tempoLiturgico"].to_s.strip.empty?
    warnings << "#{relative}: diaSemana ausente" if info["diaSemana"].to_s.strip.empty?
  elsif !info.nil?
    errors << "#{relative}: liturgia-info.json precisa conter um objeto JSON"
  end

  metadata = {}
  if hours_info.is_a?(Array)
    hours_info.each_with_index do |entry, index|
      unless entry.is_a?(Hash)
        errors << "#{relative}: horas-info.json[#{index}] não é um objeto"
        next
      end
      slug = entry["hora"].to_s.strip
      if slug.empty?
        errors << "#{relative}: horas-info.json[#{index}] não possui o campo hora"
        next
      end
      warnings << "#{relative}: Hora desconhecida no JSON: #{slug}" unless HOURS.include?(slug)
      errors << "#{relative}: metadados duplicados para #{slug}" if metadata.key?(slug)
      metadata[slug] = entry
      warnings << "#{relative}: #{slug} sem hora-title" if entry["hora-title"].to_s.strip.empty?
      warnings << "#{relative}: #{slug} sem titulo" if entry["titulo"].to_s.strip.empty?
      warnings << "#{relative}: #{slug} sem capa, será usada a imagem da cor litúrgica" if entry["capa"].to_s.strip.empty?
    end
  elsif !hours_info.nil?
    errors << "#{relative}: horas-info.json precisa conter uma lista"
  end

  HOURS.each do |slug|
    path = directory.join("#{slug}.html")
    if metadata.key?(slug) && !path.file?
      errors << "#{relative}: #{slug} aparece no JSON, mas #{slug}.html está ausente"
      next
    end
    next unless path.file?

    html = path.read(encoding: "UTF-8")
    warnings << "#{relative}/#{slug}.html: título h1 ausente" unless html.match?(/<h1\b/i)
    warnings << "#{relative}/#{slug}.html: contém script legado, que será removido na publicação" if html.match?(/<script\b/i)
    warnings << "#{relative}/#{slug}.html: contém chamada Android, que será substituída pelo site" if html.include?("Android.")
    warnings << "#{relative}/#{slug}.html: contém &nbsp; dentro de tag" if html.match?(/<[^>]*&nbsp;[^>]*>/i)
    warnings << "#{relative}/#{slug}.html: contém marcador isolado -i ou -ii" if html.match?(/>\s*-(?:i|ii)\s*</i)
    warnings << "#{relative}/#{slug}.html: não possui metadados em horas-info.json" unless metadata.key?(slug)
  end

  invitatory = directory.join("invitatorio.html")
  warnings << "#{relative}: invitatorio.html ausente" unless invitatory.file?

  if mass.is_a?(Array)
    mass.each_with_index do |section, index|
      unless section.is_a?(Hash)
        errors << "#{relative}: liturgy.json[#{index}] não é um objeto"
        next
      end
      warnings << "#{relative}: liturgy.json[#{index}] sem title" if section["title"].to_s.strip.empty?
      warnings << "#{relative}: liturgy.json[#{index}] sem html" if section["html"].to_s.strip.empty?
    end
  elsif !mass.nil?
    errors << "#{relative}: liturgy.json precisa conter uma lista"
  end
end

puts "Pacotes analisados: #{directories.length}"
puts "Erros: #{errors.length}"
puts "Avisos: #{warnings.length}"

warnings.each { |message| puts "AVISO: #{message}" }
errors.each { |message| warn "ERRO: #{message}" }

exit(errors.empty? ? 0 : 1)
