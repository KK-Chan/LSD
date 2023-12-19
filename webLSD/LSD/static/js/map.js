// 보안 토큰 불러오는 코드
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrf_token = getCookie('csrftoken');


// 범례 생성
function createLegend(legendLabels, legendColors) {
 d3.select('#legend-container').select('svg').remove();

  var legend = d3.select('#legend-container')
    .append('svg')
    .attr('class', 'legend')
    .attr('width', 110);

  var legendRectSize = 18;
  var legendSpacing = 4;

  // 계산된 범례 컨테이너의 높이
  var legendHeight = legendLabels.length * (legendRectSize + legendSpacing + 4);

  // 범례 컨테이너의 높이 설정
  legend.attr('height', legendHeight);

  var legendEntries = legend.selectAll('.legend-entry')
    .data(legendLabels)
    .enter()
    .append('g')
    .attr('class', 'legend-entry')
    .attr('transform', function(d, i) {
      var height = legendRectSize + legendSpacing;
      var vert = i * height;
      return 'translate(0,' + vert + ')';
    });

  legendEntries.append('rect')
    .attr('width', legendRectSize)
    .attr('height', legendRectSize)
    .style('fill', function(d, i) {
      return legendColors[i];
    });

  legendEntries.append('text')
    .attr('x', legendRectSize + legendSpacing)
    .attr('y', legendRectSize - legendSpacing)
    .text(function(d) {
      return d;
    });
}


function sd_layer(){
    if (map.getSource('polygon-layer')) {
        map.removeLayer('line-layer');
        map.removeLayer('polygon-layer');
        map.removeSource('polygon-layer');
    }
    else {
        $.ajax({
            type: 'POST',
            url: "/sido_layer/",
            data: {
                'csrfmiddlewaretoken': csrf_token,
            },
            dataType: 'json',
            success: function(data) {
                geoJSON = JSON.parse(data.sd_5179); // GeoJSON 데이터 파싱
                console.log(geoJSON); // 콘솔에 출력

                // 새로운 레이어 추가
                map.addSource('polygon-layer', {
                    'type': 'geojson',
                    'data': geoJSON
                });
                map.addLayer({
                    'id': 'polygon-layer',
                    'type': 'fill',
                    'source': 'polygon-layer',
                    'layout': {},
                    'paint': {
                        'fill-color': '#5D75F9',
    //                    'fill-opacity': 0.5
                    }
                });

                map.addLayer({
                    'id': 'line-layer',
                    'type': 'line',
                    'source': 'polygon-layer',
                    'layout': {},
                    'paint': {
                        'line-color': 'black', // 테두리 라인 색상을 투명으로 설정
                        'line-width': 0.5 // 테두리 라인의 두께 설정
                    }
                });

                //console.log(polygonlayers)
            },
            error: function(request, status, error) {
                alert("선택된 지역은 데이터가 없습니다!")
                console.log(error)
                if (map.getSource('polygon-layer')) {
                    map.removeLayer('line-layer');
                    map.removeLayer('polygon-layer');
                    map.removeSource('polygon-layer');
                }
            }
        });
    }
}

function lsd_layer(){
    if (map.getSource('point-layer')) {
        map.removeLayer('point-layer');
        map.removeSource('point-layer');
    }
    else {
        $.ajax({
            type: 'POST',
            url: "/lsd_layer/",
            data: {
                'csrfmiddlewaretoken': csrf_token,
            },
            dataType: 'json',
            success: function(data) {
                geoJSON = JSON.parse(data.lsd_5179); // GeoJSON 데이터 파싱
                console.log(geoJSON); // 콘솔에 출력
                // 이전에 추가된 레이어 삭제


                // 새로운 레이어 추가
                map.addSource('point-layer', {
                    type: 'geojson',
                    data: geoJSON
                });

                map.addLayer({
                    id: 'point-layer',
                    type: 'circle',
                    source: 'point-layer',
                    paint: {
                        'circle-radius': 5,
                        'circle-color': '#00B992',
                        'circle-stroke-color': 'black',
                        'circle-stroke-width': 2
                    }
                });

                //console.log(polygonlayers)
            },
            error: function(request, status, error) {

                alert("선택된 지역은 데이터가 없습니다!")
                console.log(error)
                // 선택 해제 시 데이터 삭제
                if (map.getSource('point-layer')) {
                    map.removeLayer('point-layer');
                    map.removeSource('point-layer');
                }
            }
        });
    }
}

function lsd_cal(weight, layerId){
    if (map.getSource('point-layer')) {
        map.removeLayer('point-layer');
        map.removeSource('point-layer');
    }

    if (map.getSource(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId);
    }

    var requestData = {
        'inputDay': $('#inputDay').val(),  // 시간에 대한 사용자 입력
        'inputTW': $('#inputTW').val(),    // tw에 대한 사용자 입력
        'inputMeter': $('#inputMeter').val(),  // Meter에 대한 사용자 입력
        'inputSW': $('#inputSW').val(),    // sw에 대한 사용자 입력
    };

    console.log(JSON.stringify(requestData));

    $.ajax({
        type: 'POST',
        url: "/lsd_cal/",
        data: JSON.stringify(requestData),
        contentType: 'application/json',
        dataType: 'json',
        headers: {
            'X-CSRFToken': csrf_token // CSRF 토큰을 가져와서 요청 헤더에 추가
        },
        success: function(data) {
            geoJSON = JSON.parse(data.lsd_cal); // GeoJSON 데이터 파싱
            var features = geoJSON.features

            console.log(features); // 콘솔에 출력
            // 이전에 추가된 레이어 삭제

            var tableBody = $('.table-body-container #lsdTableBody tbody');
            tableBody.empty(); // 기존 테이블 내용 비우기
            // 포인트 정보를 테이블에 추가

            var dataValues = [];

            features.forEach(function(feature) {
                var properties = feature.properties;
                var value = properties[weight];

                dataValues.push(value);

                var row = '<tr>' +
                    '<td class="col-width-15">' + properties.차수 + '</td>' +
                    '<td class="col-width-30">' + properties.Cnf_Dt + '</td>' +
                    '<td class="col-width-27">' + properties.CNT_BN + '</td>' +
                    '<td class="col-width-27">' + properties.CNT_ST.toFixed(2) + '</td>' +
                    '</tr>';

                tableBody.append(row);
            });

            dataValues.sort(function(a, b) {
                return a - b;
            });

            // 등분위수 계산 (4분위수로 나누는 경우)
            var firstQuintile = d3.quantile(dataValues, 0.20);
            var secondQuintile = d3.quantile(dataValues, 0.40);
            var thirdQuintile = d3.quantile(dataValues, 0.60);
            var fourthQuintile = d3.quantile(dataValues, 0.80);


            // 폴리곤 레이어의 색상 지정
            features.forEach(function(feature) {
                var properties = feature.properties;
                var value = properties[weight];
                var color;
                    // 등분위수에 따라 색상 지정
                if (value <= firstQuintile) {
                    color = '#2b83ba';
                } else if (value <= secondQuintile) {
                    color = '#abdda4';
                } else if (value <= thirdQuintile) {
                    color = '#ffffbf';
                } else if (value <= fourthQuintile) {
                    color = '#fdae61';
                } else {
                    color = '#d7191c';
                }

                // 폴리곤의 속성으로 color 값을 추가
                feature.properties.color = color;
            });


            // 등분위수 색상 설정
            var colorScale = d3.scaleThreshold()
                .domain([firstQuintile, secondQuintile, thirdQuintile, fourthQuintile])
                .range(['#2b83ba', '#abdda4', '#ffffbf', '#fdae61', '#d7191c']);

            // 소수점 2자리
            function formatDecimal(value) {
                return parseFloat(value).toFixed(2);
            }
            // 범례 레이블과 색상 매핑
            var legendLabels = [
                '~ ' + formatDecimal(firstQuintile),
                formatDecimal(firstQuintile) + ' ~ ' + formatDecimal(secondQuintile),
                formatDecimal(secondQuintile) + ' ~ ' + formatDecimal(thirdQuintile),
                formatDecimal(thirdQuintile) + ' ~ ' + formatDecimal(fourthQuintile),
                formatDecimal(fourthQuintile) + ' ~ '
            ];
            var legendColors = ['#2b83ba', '#abdda4', '#ffffbf', '#fdae61', '#d7191c'];

            // 범례 생성 함수 호출
            createLegend(legendLabels, legendColors);

            // 새로운 레이어 추가
            map.addSource(layerId, {
                type: 'geojson',
                data: geoJSON
            });

            map.addLayer({
                id: layerId,
                type: 'circle',
                source: layerId,
                paint: {
                    'circle-radius': ['*', ['get', weight], 5],
                    'circle-color': ['get', 'color'],
                    'circle-opacity': 0.8,
                    'circle-stroke-color': 'black',
                    'circle-stroke-width': 0.5
                }
            });

        },
        error: function(request, status, error) {

            alert("파라미터 값을 정해주세요.")
            console.log(error)
            // 선택 해제 시 데이터 삭제
            if (map.getSource('point-layer')) {
                map.removeLayer('point-layer');
                map.removeSource('point-layer');
            }
            if (map.getSource(layerId)) {
                map.removeLayer(layerId);
                map.removeSource(layerId);
            }
        }
    });
}

//// 현재 스위치 상태에 따라 보여줄 레이어와 범례 설정
//function updateVisibleLayer() {
//    var isSwitchChecked = document.getElementById('switch').checked;
//
//    // 스위치 상태에 따라 레이어와 범례 표시/숨김
//    map.setLayoutProperty('lsd-layer-bn', 'visibility', isSwitchChecked ? 'none' : 'visible');
//    map.setLayoutProperty('lsd-layer-st', 'visibility', isSwitchChecked ? 'visible' : 'none');
//    // 범례도 이와 유사하게 업데이트
//}



// 특정 속성 값을 가진 피처 찾기 함수
function findFeatureByProperty(propertyName, propertyValue) {
    var features = geoJSON.features;
    for (var i = 0; i < features.length; i++) {
        if (features[i].properties[propertyName] === propertyValue) {
            return features[i];
        }
    }
    console.log("Feature not found for", propertyName, propertyValue);
    return null;
}

// 지도 줌인
function zoomToPoint(coordinates) {
    map.flyTo({
        center: coordinates,
        zoom: 10
    });
}


// 지도상의 포인트 강조
function highlightPointOnMap(pointFeature) {
    var layerId = 'highlight-point-layer';

    // 이전 강조 레이어 제거
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId);
    }

    // 새 강조 레이어 추가
    map.addSource(layerId, {
        type: 'geojson',
        data: pointFeature
    });

    map.addLayer({
        id: layerId,
        type: 'circle',
        source: layerId,
        paint: {
            'circle-radius': ['*', ['get', 'CNT_ST'], 5],
            'circle-color': 'yellow',
            'circle-stroke-color': 'black',
            'circle-stroke-width': 1
        }
    });
}


function jsonToCSV(jsonArray) {
    // 1. JSON 데이터 취득: 여기서는 `properties` 객체를 기준으로 합니다.
    var json_array = jsonArray.map(item => item.properties);

    // 2. CSV 문자열 변수 선언: json을 csv로 변환한 문자열이 담길 변수
    let csv_string = '';

    // 3. 제목 추출: `properties` 객체의 키를 제목으로 사용
    if (json_array.length > 0) {
        const titles = Object.keys(json_array[0]).slice(0, -1);
        csv_string += titles.join(',') + '\r\n';

        // 4. 내용 추출: 각 `properties` 객체의 값을 추출
        json_array.forEach(content => {
            const values = titles.map(title => {
                // 값이 없는 경우 빈 문자열로 처리
                return content[title] ? content[title].toString().replace(/"/g, '""') : '';
            });
            csv_string += values.join(',') + '\r\n';
        });
    }

    // 6. CSV 문자열 반환: 최종 결과물(string)
    return csv_string;
}


//CSV 생성 함수
function saveCSV(fileName){
    var downLink = document.getElementById('csvDownload');

    var features = geoJSON.features;

    var csvData = jsonToCSV(features);

    console.log(csvData);
    console.log(typeof(csvData));

    var bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM

    //CSV 파일 저장
    csvFile = new Blob([bom, csvData], {type: "text/csv;charset=utf-8;"}); // 생성한 CSV 문자열을 Blob 데이터로 생성
    downLink.href = window.URL.createObjectURL(csvFile); // Blob 데이터를 URL 객체로 감싸 다운로드 하이퍼링크에 붙임.
    downLink.download = fileName + '.csv'; // 인자로 받은 다운로드 파일명을 지정
}
