let url;
let resourceId;
let unknown_text = '';

if (document.documentElement.lang == 'en') {
  url = 'https://data.opendevelopmentcambodia.net/en/api/3/action/datastore_search';
  resourceId = '50d26fc8-e451-4486-9252-6cdf09a34fea';
  unknown_text = 'Unknown'
} else {
  url = 'https://data.opendevelopmentcambodia.net/km/api/3/action/datastore_search';
  resourceId = '2515b02f-3e0e-48af-8d58-219cc97a5b0b';
  unknown_text = 'មិនស្គាល់'
}

const limit = 500;

const datasetUrl = url + '?resource_id=' + resourceId + '&limit=' + limit;

let projects = [];

const chartHeightScale  = 0.55;
const pieXscale         = 1.41;
const pieRscale         = chartHeightScale * 0.5;

function setHeight(chart) {
  return chart.width() * chartHeightScale;
}

try {
  d3.json(datasetUrl).then(data => {
    let records = data.result.records;

    records.forEach(record => {
      let value = {
        project_type        : record.dev_pro,
        developer           : record.pro_dev,
        project_url         : record.link_p,
        sector              : record.sector,
        // investment_mm       : d3.format(',.2r')(record.cap_inv_m),
        // investment          : d3.format(',.2r')(record.cap_inv),
        investment_mm       : record.cap_inv_m,
        investment          : record.cap_inv,
        nationality         : (!record.nat_pro) ? unknown_text : record.nat_pro,
        job_creation        : record.job_creat,
        year_start          : (!record.sta_oper) ? unknown_text : record.sta_oper,
        province            : record.pro_loc,
        data_classification : record.data_c,
        reference           : record.reference,
        lat                 : record.lat,
        lng                 : record.long,
      }

      projects.push(value);
    })

    return projects;
  }).then(projects => {
    let ndx = crossfilter(projects);
    let all = ndx.groupAll();

    // Dimension
    let projectsByCoordinate = ndx.dimension(d => {
      let projectInfo = [
        d.lat,
        d.lng,
      ];

      return projectInfo;
    })

    let sectorDimension = ndx.dimension(d => d.sector);
    let investmentSectorDimension = ndx.dimension( d => d.sector );
    let investmentDimension = ndx.dimension(d => d.investment_mm);
    let provinceDimension = ndx.dimension(d => d.province);
    let nationalityDimension = ndx.dimension(d => d.nationality);

    let projectDimension = ndx.dimension(d => [
      d.sector,
      d.developer,
      d.project_type,
      d.investment_mm,
      d.nationality,
      d.year_start,
    ])

    // Group
    let coordinateGroup = projectsByCoordinate.group().reduce((p, v) => {
      p.lat           = v.lat;
      p.lng           = v.lng;
      p.project_type  = v.project_type;
      p.developer     = v.developer;
      p.project_url   = v.project_url;
      p.sector        = v.sector;
      p.investment_mm = v.investment_mm;
      p.nationality   = v.nationality;
      p.province      = v.province;

      ++p.count;
      return p;
    }, (p, v) => {
      --p.count;
      return p;
    }, () => {
      return {count: 0};
    });

    let sectorGroup = sectorDimension.group().reduceCount();
    let investmentGroup = sectorDimension.group().reduceSum(d => d.investment_mm);
    let provinceGroup = provinceDimension.group().reduceCount();
    let investmentNationalityGroup = nationalityDimension.group().reduceSum(d => d.investment_mm);
    let projectGroup = projectDimension.group();
  
    // Charts
    let projectsByCoordinateMapChart = dc_leaflet.markerChart('#cluster-map-anchor');
    
    let projectsBySectorPieChart = dc.pieChart('#projects-by-sector-pie-chart');
    let projectsByProvincePieChart = dc.pieChart('#projects-by-province-pie-chart');

    let investmentBySectorRowChart = dc.rowChart('#chart-ring-sector');
    
    let investmentByNationalityRowChart = dc.rowChart('#chart-ring-nationality');

    projectsByCoordinateMapChart
      .dimension(projectsByCoordinate)
      .group(coordinateGroup)
      .map(map)
      .valueAccessor(d => d.value.count)
      .showMarkerTitle(false)
      .fitOnRender(true)
      .fitOnRedraw(true)
      .filterByArea(true)
      .cluster(true)
      .popup(d => {
        return '<p>ឈ្មោះអ្នកអភិវឌ្ឍ៖ <a target="_blank" href="' + d.value.project_url + '">' + d.value.developer + '</a></p>' +
              '<p>ទុនវិនិយោគ៖ <strong>' + d.value.investment_mm + ' លានដុល្លា</strong></p>' +
              '<p>គម្រោងអភិវឌ្ឍន៍៖ <strong>' + d.value.project_type + '</strong></p>' +
              '<p>វិស័យ៖ <strong>' + d.value.sector + '</strong></p>';
      })
      .clusterOptions({
        spiderfyOnMaxZoom: true,
        spiderLegPolylineOptions: {
          weight: 1,
          color: '#000',
          opacity: 0.8,
        }
      })

    projectsBySectorPieChart
      .dimension(sectorDimension)
      .group(sectorGroup)
      .useViewBoxResizing(true)
      .height(setHeight(projectsBySectorPieChart) - 30)
      .cx(projectsBySectorPieChart / pieXscale)
      .radius(projectsBySectorPieChart * pieRscale)
      // .slicesCap(8)
      .innerRadius(40)
      .externalLabels(200)
      .legend(dc.legend()
        .y(Math.round(projectsBySectorPieChart.height()) * 0.02, 1)
        .gap(Math.round(projectsBySectorPieChart.height() * 0.02, 1))
      )

    investmentBySectorRowChart
      .dimension(investmentSectorDimension)
      .group(investmentGroup)
      .height(setHeight(investmentBySectorRowChart) - 10)
      .cap(8)
      .useViewBoxResizing(true)
      .elasticX(true)
      .ordering( d => -d.value )
      .xAxis().ticks(5)

    projectsByProvincePieChart
      .dimension(provinceDimension)
      .group(provinceGroup)
      .height(setHeight(projectsByProvincePieChart) - 30)
      .cx(projectsByProvincePieChart / pieXscale)
      .radius(projectsByProvincePieChart * pieRscale)
      .slicesCap(5)
      .useViewBoxResizing(true)
      .innerRadius(40)
      .externalLabels(200)
      .legend(dc.legend()
        .y(Math.round(projectsByProvincePieChart.height()) * 0.02, 1)
        .gap(Math.round(projectsByProvincePieChart.height() * 0.02, 1))
      )

    investmentByNationalityRowChart
      .dimension(nationalityDimension)
      .group(investmentNationalityGroup)
      .useViewBoxResizing(true)
      .height(setHeight(investmentByNationalityRowChart) - 10)
      .cap(8)
      .elasticX(true)
      .ordering(function(d) {
        return -d.value;
      })
      .xAxis().ticks(6)

    // DataTables
    const datatableCount = dc.dataCount('.dc-datatable-count');
    const datatable = dc.tableview('#fim-datatable')

    const columns = [
      {
        title : (document.documentElement.lang == 'en') ? 'Development project' : 'គម្រោងអភិវឌ្ឍន៍',
        data  : d => d.project_type
      },
      {
        title : (document.documentElement.lang == 'en') ? 'Project developer' : 'ឈ្មោះអ្នកអភិវឌ្ឍន៍',
        data  : d => d.developer,
      },
      {
        title : (document.documentElement.lang == 'en') ? 'Nationality of project' : 'ប្រទេសអភិវឌ្ឍគម្រោង',
        data  : d => d.nationality,
      },
      {
        title : (document.documentElement.lang == 'en') ? 'Capital investment (millions USD)' : 'ទុនវិនិយោគ (លានដុល្លា)',
        data  : d => d.investment_mm,
      },
      {
        title : (document.documentElement.lang == 'en') ? 'Started year' : 'គម្រោងចាប់ផ្តើម',
        data  : d => d.year_start,
      }
    ]

    datatableCount
      .crossfilter(ndx)
      .groupAll(all)

    datatable
      .dimension(projectDimension)
      .group(projectGroup)
      .columns(columns)
      .size(25)
      .enableColumnReordering(true)
      .enablePaging(true)
      .enablePagingSizeChange(true)
      .enableSearch(true)
      .enableAutoWidth(true)
      .fixedHeader(true)
      .enableScrolling(false)
      .scrollingOptions({
        scrollY: Infinity,
        scrollCollapse: true,
        deferRender: true,
      })
      .groupBy(d => d.sector)
      .showGroups(true)
      .select(true)
      .buttons(["pdf", "csv", "excel", "print"])

    dc.renderAll();
  })
} catch (error) {
  console.log(error)
}
