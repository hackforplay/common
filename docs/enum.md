---
title: Enum
file_name: enum
---

{% for entry in site.data.reference.ja[page.file_name] %}
{% assign name = entry[0] %}
{% assign field = entry[1] %}

# {{ field.name }}

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
