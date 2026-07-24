#!/usr/bin/env ruby
# encoding: UTF-8
# frozen_string_literal: true

require 'yaml'
require 'date'
require 'pathname'

root = Pathname(ARGV[0] || '_santos')
unless root.directory?
  warn "Diretório não encontrado: #{root}"
  exit 2
end

SUPPORTED_RULES = %w[
  easter easter_offset pascoa pascoa_offset ash_wednesday quarta_feira_de_cinzas
  sacred_heart sagrado_coracao christmas christmas_offset natal natal_offset
  advent advent_offset advento advento_offset nth_weekday weekday_after_fixed
  weekday_before_fixed fixed_offset
].freeze
LIST_FIELDS = %w[aliases tags keywords patronages virtues related_saints related].freeze
SLUG_PATTERN = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/

errors = []
warnings = []
slugs = {}

front_matter = lambda do |path|
  text = path.read(encoding: 'UTF-8')
  match = text.match(/\A---\s*\n(.*?)\n---\s*(?:\n|\z)/m)
  raise 'front matter ausente ou malformado' unless match

  YAML.safe_load(match[1], permitted_classes: [Date, Time], aliases: true) || {}
end

integer = lambda do |value|
  Integer(value)
rescue ArgumentError, TypeError
  nil
end

root.glob('**/*.{md,markdown}').sort.each do |path|
  begin
    data = front_matter.call(path)
  rescue StandardError => e
    errors << "#{path}: #{e.message}"
    next
  end

  title = data['title'].to_s.strip
  slug = data['slug'].to_s.strip
  errors << "#{path}: o campo title é obrigatório" if title.empty?
  if slug.empty?
    errors << "#{path}: o campo slug é obrigatório"
  elsif !slug.match?(SLUG_PATTERN)
    errors << "#{path}: slug inválido '#{slug}'; use letras minúsculas sem acentos, números e hífens"
  elsif slugs.key?(slug)
    errors << "#{path}: slug duplicado '#{slug}', já usado em #{slugs[slug]}"
  else
    slugs[slug] = path
  end

  LIST_FIELDS.each do |field|
    next if data[field].nil? || data[field].is_a?(Array)

    errors << "#{path}: #{field} deve ser uma lista YAML"
  end

  if data['image']
    width = integer.call(data['image_width'])
    height = integer.call(data['image_height'])
    if width.nil? || height.nil?
      errors << "#{path}: imagens exigem image_width e image_height numéricos"
    elsif width <= height
      errors << "#{path}: a imagem deve ser horizontal, mas foi declarada como #{width}x#{height}"
    elsif width.to_f / height < 1.5
      warnings << "#{path}: a imagem é horizontal, porém a proporção recomendada é 16:9"
    end
    warnings << "#{path}: image_alt está vazio" if data['image_alt'].to_s.strip.empty?
  end

  date_rule = data['liturgical_date']
  unless date_rule.is_a?(Hash)
    errors << "#{path}: liturgical_date deve ser um objeto, inclusive para conteúdos sem data"
    next
  end

  type = date_rule['type'].to_s.strip.downcase.tr(' -', '__')
  if type.empty?
    errors << "#{path}: liturgical_date.type é obrigatório"
    next
  end

  next if %w[none undated sem_data].include?(type)

  if type == 'fixed'
    month = integer.call(date_rule['month'])
    day = integer.call(date_rule['day'])
    if month.nil? || day.nil? || !Date.valid_date?(2000, month, day)
      errors << "#{path}: data fixa inválida; informe month e day válidos"
    end
    next
  end

  rule = type == 'movable' ? date_rule['rule'].to_s.strip.downcase.tr(' -', '__') : type
  unless SUPPORTED_RULES.include?(rule)
    errors << "#{path}: regra móvel não reconhecida '#{rule}'"
    next
  end

  case rule
  when 'nth_weekday'
    month = integer.call(date_rule['month'])
    weekday = integer.call(date_rule['weekday'])
    occurrence = integer.call(date_rule['occurrence'])
    errors << "#{path}: nth_weekday exige month entre 1 e 12" unless month&.between?(1, 12)
    errors << "#{path}: nth_weekday exige weekday entre 0 e 6" unless weekday&.between?(0, 6)
    errors << "#{path}: nth_weekday exige occurrence entre 1 e 5 ou -1 e -5" unless occurrence && occurrence != 0 && occurrence.between?(-5, 5)
  when 'weekday_after_fixed', 'weekday_before_fixed'
    month = integer.call(date_rule['month'])
    day = integer.call(date_rule['day'])
    weekday = integer.call(date_rule['weekday'])
    errors << "#{path}: #{rule} exige uma data base válida" unless month && day && Date.valid_date?(2000, month, day)
    errors << "#{path}: #{rule} exige weekday entre 0 e 6" unless weekday&.between?(0, 6)
  when 'fixed_offset'
    month = integer.call(date_rule['month'])
    day = integer.call(date_rule['day'])
    errors << "#{path}: fixed_offset exige uma data base válida" unless month && day && Date.valid_date?(2000, month, day)
  end

  %w[year_from year_to].each do |field|
    next unless date_rule.key?(field)
    errors << "#{path}: #{field} deve ser um ano inteiro" if integer.call(date_rule[field]).nil?
  end
end

warnings.each { |message| warn "AVISO: #{message}" }
if errors.any?
  errors.each { |message| warn "ERRO: #{message}" }
  warn "\nValidação encerrada com #{errors.size} erro(s) e #{warnings.size} aviso(s)."
  exit 1
end

puts "Validação concluída: #{slugs.size} arquivo(s), nenhum erro e #{warnings.size} aviso(s)."
