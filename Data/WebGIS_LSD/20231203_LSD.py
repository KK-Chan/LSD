import numpy as np
import pandas as pd
import geopandas as gpd
from scipy.spatial import distance

# define spatial weight function
def sw_dist(dist, tsw, tsd):
    spatial_weight = np.exp(dist * np.log(tsw) / tsd)
    return spatial_weight

df = pd.read_csv('./Data/WebGIS_LSD/Data/LSD_5179_CSV_1204.txt', encoding='cp949', sep='|')

# 아래 parameter 값들은 시간적 , 공간적 범위를 결정
tsw = 0.1; tsd = 3000  # tsw = threshold spatial weight; tsd = threshold spatial distance
ttw = 0.1; ttd = 10   # ttw = threshold temporal weight; ttd = threshold temporal distance

# 공간가중치 행렬(od_sw_mat) 생성 : origin destination spatial weight matrix
od_x, od_y = np.array(df['px']), np.array(df['py'])
arr_od = np.stack([od_x, od_y], 1)
od_dist_matrix = distance.cdist(arr_od, arr_od)
od_sw_mat = sw_dist(od_dist_matrix, tsw, tsd)
print(arr_od)
# 시간가중치 행렬(ft_tw_mat) 생성 : from to temporal weight matrix
con_dt = np.array(df['확진일'])
arr_con_dt = np.stack([con_dt, con_dt], 1)
ft_dist_matrix = distance.cdist(arr_con_dt, arr_con_dt)
ft_tw_mat = sw_dist(ft_dist_matrix, ttw, ttd)

#아르마다 행렬 곱을 적용하여 시공간가중치 행렬(= 공간가중치 * 시간가중치) 생성 : spatial temporal weigh matrix
stw_mat = od_sw_mat * ft_tw_mat

#모든 발생지점을 기준으로 시공간가중 발생지점의 개수 행렬 (st_cnt_matrix) 계산
st_cnt_matrix = np.sum(stw_mat, axis=0)

#시공간 가중행렬 적용하지 않은 발생시점 개수 행렬 : 시간 ttd 범위 내 & 공간 td 범위 내
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
#*******************************************************************************************************************************
gdf_occurrences = gpd.GeoDataFrame(df_id_x_y_date_count[['차수', 'X', 'Y', 'Cnf_Dt', 'CNT_BN', 'CNT_ST']],
                       geometry=gpd.points_from_xy(df_id_x_y_date_count.X, df_id_x_y_date_count.Y), crs='epsg:5179')

parameters = 'counts(' + str(tsd) + '_' + str(tsw) + '_' + str(ttd) + '_' + str(ttw) + ')'

# gdf_occurrences.crs= "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"
gdf_occurrences.to_file('./Data/WebGIS_LSD/Data/' + parameters + '.shp', encoding='cp949', driver='ESRI Shapefile')
#*******************************************************************************************************************************