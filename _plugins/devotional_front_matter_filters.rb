# frozen_string_literal: true

# Filtros usados pelo motor devocional para ler o front matter de documentos
# sem expor o Jekyll::Drops::DocumentDrop ao Liquid. Isso evita que campos
# como `count` sejam confundidos com métodos de Enumerable e disparem a
# enumeração recursiva de `next` e `previous`.
module Oratio
  module DevotionalFrontMatterFilters
    DEVOTIONAL_PRAYER_FIELDS = %w[
      id
      label
      label-latin
      label_latin
      title
      sequence_title
      prayer
      prayer-latin
      prayer_latin
      common-prayer
      common_prayer
      texts
      text
      language-toggle
      language_toggle
      prayer-url
      prayer_url
      default-language
      default_language
      count
      note
    ].freeze

    def front_matter_value(input, key)
      front_matter_data(input)[key.to_s]
    end

    def devotional_prayer_data(input)
      data = front_matter_data(input)

      DEVOTIONAL_PRAYER_FIELDS.each_with_object({}) do |field, result|
        result[field] = data[field] if data.key?(field)
      end
    end

    private

    def front_matter_data(input)
      return {} if input.nil?
      return stringify_keys(input) if input.is_a?(Hash)

      source = if input.instance_variable_defined?(:@obj)
                 input.instance_variable_get(:@obj)
               else
                 input
               end

      return {} unless source.respond_to?(:data)
      return {} unless source.data.is_a?(Hash)

      stringify_keys(source.data)
    end

    def stringify_keys(hash)
      hash.each_with_object({}) do |(key, value), result|
        result[key.to_s] = value
      end
    end
  end
end

Liquid::Template.register_filter(Oratio::DevotionalFrontMatterFilters)
