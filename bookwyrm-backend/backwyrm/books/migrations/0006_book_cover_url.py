# Generated by Django 5.2.1 on 2025-05-30 17:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0005_book_content_warnings'),
    ]

    operations = [
        migrations.AddField(
            model_name='book',
            name='cover_url',
            field=models.URLField(blank=True, null=True),
        ),
    ]
