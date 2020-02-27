---
title: Hack
file_name: hack
---

{% for entry in site.data.reference.ja[page.file_name] %}
{% assign root = entry[1] %}

# {{ root.name }}

> {{ root.desc | newline_to_br }}

{% for fields in root.fields %}
{% assign name = fields[0] %}
{% assign field = fields[1] %}

## {{ field.name }}

> {{ field.desc | newline_to_br }}

- 英語名：`{{ name }}`
- タイプ：`{{ field.type | default: 'unknown' }}`

{% if field.init %}

- 初期値：`{{ field.init }}`

{% endif %}

{% if field.code %}

- 使い方

{% highlight javascript %}
{{ field.code }}
{% endhighlight %}

{% endif %}

{% endfor %}

{% endfor %}
