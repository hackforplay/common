---
title: チートシート
---

{% assign files = 'global,rpgobject,enum,hack' | split: ','  %}
{% for file in files %}
{% for entry in site.data.reference.ja[file] %}
{% assign value = entry[1] %}

{% if value.type == 'class' %}

{% for fields in value.fields %}
{% assign field = fields[1] %}

- **[{{ field.name }}](/{{ file }}#{{ field.name }})** {{ field.desc | split: " " | first }}

{% endfor %}

{% else %}

{% assign field = entry[1] %}

- **[{{ field.name }}](/{{ file }}#{{ field.name }})** {{ field.desc | split: " " | first }}

{% endif %}

{% endfor %}
{% endfor %}
