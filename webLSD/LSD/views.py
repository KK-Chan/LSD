from django.shortcuts import render
import numpy as np
import pandas as pd
import geopandas as gpd
from scipy.spatial import distance
from .models import *
from django.http.response import *
from django.http import JsonResponse
from django.contrib.gis.serializers.geojson import Serializer as GeoJSONSerializer
from shapely.wkt import loads as wkt_loads
import json
from django.contrib.gis.geos import GEOSGeometry


# Create your views here.

def default_map(request):
    mapbox_access_token = 'pk.eyJ1IjoibWFzNzk4OSIsImEiOiJjbG84ajEwcW8wMW1oMnNxY2tzZmJrengzIn0.6aM-kFV6ZlO5W9-0jkunLw'
    return render(request, 'default.html',
                  {'mapbox_access_token': mapbox_access_token})


def sido_layer(request):
    if request.method == 'POST':
        sd_5179 = SD_5179.objects.all()
        geojson_serializer = GeoJSONSerializer()
        geojson_data = geojson_serializer.serialize(sd_5179)
        return JsonResponse({'sd_5179': geojson_data}, safe=False)
    return JsonResponse({'error': 'Invalid request method'})

def lsd_layer(request):
    if request.method == 'POST':
        lsd_5179 = Lsd5179.objects.all()
        geojson_serializer = GeoJSONSerializer()
        geojson_data = geojson_serializer.serialize(lsd_5179)
        print(geojson_data)
        return JsonResponse({'lsd_5179': geojson_data}, safe=False)
    return JsonResponse({'error': 'Invalid request method'})

def sw_dist(dist, tsw, tsd):
    spatial_weight = np.exp(dist * np.log(tsw) / tsd)
    return spatial_weight

def lsd_cal(request):
    if request.method == 'POST':
        lsd_5179 = Lsd5179.objects.all().values()
        lsd_5179 = pd.DataFrame(lsd_5179)
        lsd_5179['신고일_f'] = lsd_5179['신고일_f'].astype('string')
        lsd_5179['확진일_f'] = lsd_5179['확진일_f'].astype('string')
        print(lsd_5179)

        lsd_5179['geom'] = lsd_5179['geom'].apply(lambda x: wkt_loads(GEOSGeometry(x).wkt))
        df = gpd.GeoDataFrame(lsd_5179, geometry='geom', crs='EPSG:5179')

        data = json.loads(request.body)
        print(data)
        # 아래 parameter 값들은 시간적 , 공간적 범위를 결정
        tsw = float(data['inputSW'])  # tsw = threshold spatial weight
        tsd = float(data['inputMeter'])  # tsd = threshold spatial distance
        ttw = float(data['inputTW'])  # ttw = threshold temporal weight
        ttd = float(data['inputDay'])  # ttd = threshold temporal distance

        # 공간가중치 행렬(od_sw_mat) 생성 : origin destination spatial weight matrix
        od_x, od_y = np.array(df['px']), np.array(df['py'])
        arr_od = np.stack([od_x, od_y], 1)
        od_dist_matrix = distance.cdist(arr_od, arr_od)
        od_sw_mat = sw_dist(od_dist_matrix, tsw, tsd)
        print(od_sw_mat)

        # 시간가중치 행렬(ft_tw_mat) 생성 : from to temporal weight matrix
        con_dt = np.array(df['확진일'])
        arr_con_dt = np.stack([con_dt, con_dt], 1)
        ft_dist_matrix = distance.cdist(arr_con_dt, arr_con_dt)
        ft_tw_mat = sw_dist(ft_dist_matrix, ttw, ttd)
        print(ft_tw_mat)

        # 아르마다 행렬 곱을 적용하여 시공간가중치 행렬(= 공간가중치 * 시간가중치) 생성 : spatial temporal weigh matrix
        stw_mat = od_sw_mat * ft_tw_mat

        # 모든 발생지점을 기준으로 시공간가중 발생지점의 개수 행렬 (st_cnt_matrix) 계산
        st_cnt_matrix = np.sum(stw_mat, axis=0)

        # 시공간 가중행렬 적용하지 않은 발생시점 개수 행렬 : 시간 ttd 범위 내 & 공간 td 범위 내
        binary_cnt_spatial = np.where(od_dist_matrix <= tsd, 1, 0)
        binary_cnt_temporal = np.where(ft_dist_matrix <= ttd, 1, 0)
        binary_cnt_spatiotemporal = binary_cnt_spatial * binary_cnt_temporal
        binary_cnt_spatiotemporal = np.sum(binary_cnt_spatiotemporal, axis=0)

        df_id_x_y_date_count = pd.DataFrame()
        df_id_x_y_date_count['차수'] = df['차수']
        df_id_x_y_date_count['X'] = df['px']
        df_id_x_y_date_count['Y'] = df['py']
        df_id_x_y_date_count['Cnf_Dt'] = df['확진일_f']
        df_id_x_y_date_count['CNT_BN'] = binary_cnt_spatiotemporal
        df_id_x_y_date_count['CNT_ST'] = st_cnt_matrix

        # GeoDataFrame을 Shapefile로 저장
        # *******************************************************************************************************************************
        gdf_occurrences = gpd.GeoDataFrame(df_id_x_y_date_count[['차수', 'X', 'Y', 'Cnf_Dt', 'CNT_BN', 'CNT_ST']],
                                           geometry=gpd.points_from_xy(df_id_x_y_date_count.X, df_id_x_y_date_count.Y),
                                           crs='epsg:5179')

        gdf_result = gdf_occurrences.to_crs('EPSG:4326').to_json()

        print(gdf_occurrences)
        return JsonResponse({'lsd_cal': gdf_result}, safe=False)
    return JsonResponse({'error': 'Invalid request method'})