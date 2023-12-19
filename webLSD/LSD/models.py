from django.db import models
from django.contrib.gis.db import models

class Layer(models.Model):
    topology = models.OneToOneField('Topology', models.DO_NOTHING, primary_key=True)
    # The composite primary key (topology_id, layer_id) found, that is not supported. The first column is selected.
    layer_id = models.IntegerField()
    schema_name = models.CharField()
    table_name = models.CharField()
    feature_column = models.CharField()
    feature_type = models.IntegerField()
    level = models.IntegerField()
    child_id = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'layer'
        unique_together = (('topology', 'layer_id'), ('schema_name', 'table_name', 'feature_column'),)


class Topology(models.Model):
    name = models.CharField(unique=True)
    srid = models.IntegerField()
    precision = models.FloatField()
    hasz = models.BooleanField()

    class Meta:
        managed = False
        db_table = 'topology'


class SD_5179(models.Model):
    geom = models.MultiPolygonField(srid=5179, blank=True, null=True)
    ctprvn_cd = models.CharField(max_length=2, blank=True, null=True)
    ctp_eng_nm = models.CharField(max_length=40, blank=True, null=True)
    ctp_kor_nm = models.CharField(max_length=40, blank=True, null=True)

    class Meta:
        managed = False
        db_table = '전국_시도_5179'

class Lsd5179(models.Model):
    geom = models.PointField(srid=5179, blank=True, null=True)
    차수 = models.IntegerField(blank=True, null=True)
    경위 = models.CharField(blank=True, null=True)
    사육두수 = models.IntegerField(blank=True, null=True)
    신고일 = models.IntegerField(blank=True, null=True)
    확진일 = models.IntegerField(blank=True, null=True)
    신고일_f = models.DateField(blank=True, null=True)
    확진일_f = models.DateField(blank=True, null=True)
    x = models.FloatField(db_column='X', blank=True, null=True)  # Field name made lowercase.
    y = models.FloatField(db_column='Y', blank=True, null=True)  # Field name made lowercase.
    px = models.FloatField(blank=True, null=True)
    py = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'LSD_5179_CSV'