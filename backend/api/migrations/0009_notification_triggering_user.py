# Generated by Django 5.1 on 2024-09-20 06:58

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_remove_notification_recipient_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='triggering_user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='triggered_notifications', to=settings.AUTH_USER_MODEL),
        ),
    ]
