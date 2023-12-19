from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'lsd_cal/$', views.lsd_cal, name='lsd_cal'),
    re_path(r'sido_layer/$', views.sido_layer, name='sido_layer'),
    re_path(r'lsd_layer/$', views.lsd_layer, name='lsd_layer'),

    re_path(r'', views.default_map, name='default')
]