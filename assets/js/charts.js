'use strict';

let url;
let resourceId;
let unknown_text = '';
const popupString = [];

if (document.documentElement.lang == 'en') {
  url = 'https://data.opendevelopmentcambodia.net/en/api/3/action/datastore_search';
  resourceId = '50d26fc8-e451-4486-9252-6cdf09a34fea';
  unknown_text = 'Not found';
  popupString['developer'] = 'Project developer (Agency / Company):';
  popupString['investment'] = 'Capital investment:';
  popupString['million_dollar'] = 'millions USD';
  popupString['project_type'] = 'Development project:';
  popupString['sector'] = 'Sector:';
} else {
  url = 'https://data.opendevelopmentcambodia.net/km/api/3/action/datastore_search';
  resourceId = '2515b02f-3e0e-48af-8d58-219cc97a5b0b';
  unknown_text = 'ពុំមានព័ត៌មាន';
  popupString['developer'] = 'អ្នកអភិវឌ្ឍន៍គម្រោង៖';
  popupString['investment'] = 'ទុនវិនិយោគ៖';
  popupString['million_dollar'] = 'លានដុល្លារ';
  popupString['project_type'] = 'គម្រោងអភិវឌ្ឍន៍៖';
  popupString['sector'] = 'វិស័យ៖';
}

const limit = 1000;

const datasetUrl = url + '?resource_id=' + resourceId + '&limit=' + limit;

let projects = [];

const chartHeightScale  = 0.55;
const pieXscale         = 1.41;
const pieRscale         = chartHeightScale * 0.5;

const projectsByCoordinateMapChart = dc_leaflet.markerChart('#cluster-map-anchor'); 
const projectsBySectorPieChart = new dc.PieChart('#projects-by-sector-pie-chart');
const projectsByProvincePieChart = new dc.PieChart('#projects-by-province-pie-chart');
const investmentByNationalityRowChart = new dc.RowChart('#investment-by-nationality-row-chart');
const investmentBySectorRowChart = new dc.RowChart('#investment-by-sector-row-chart');

function setHeight(chart) {
  return chart.width() * chartHeightScale;
}

try {
  d3.json(datasetUrl).then(data => {
    let records = data.result.records;

    records.forEach(record => {
      let value = {
        project_name        : record.pro_name,
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
        year_start          : (!record.year) ? unknown_text : record.year,
        director_name       : (!record.dir_name) ? unknown_text : record.dir_name,
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
    const ndx = crossfilter(projects);
    const all = ndx.groupAll();

    // Dimension
    const projectsByCoordinate = ndx.dimension(d => {
      let projectInfo = [
        d.lat,
        d.lng,
      ];

      return projectInfo;
    })

    const sectorDimension = ndx.dimension(d => d.sector);
    const sectorDimensionRow = ndx.dimension(d => d.sector);
    const investmentSectorDimension = ndx.dimension( d => d.sector );
    const investmentDimension = ndx.dimension(d => d.investment_mm);
    const provinceDimension = ndx.dimension(d => d.province);
    const nationalityDimension = ndx.dimension(d => d.nationality);

    const projectDimension = ndx.dimension(d => [
      d.sector,
      d.developer,
      d.project_type,
      d.investment_mm,
      d.nationality,
      d.year_start,
    ])

    // Group
    const coordinateGroup = projectsByCoordinate.group().reduce((p, v) => {
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

    const sectorGroup = sectorDimension.group().reduceCount();
    const investmentGroup = sectorDimensionRow.group().reduceSum(d => d.investment_mm);
    const provinceGroup = provinceDimension.group().reduceCount();
    const investmentNationalityGroup = nationalityDimension.group().reduceSum(d => d.investment_mm);
    const projectGroup = projectDimension.group();
  
    // Charts
    
    
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
        return `<p>${popupString['developer']} <a target="_blank" href="` + d.value.project_url + '">' + d.value.developer + '</a></p>' +
              `<p>${popupString['investment']} <strong>` + d.value.investment_mm + ` ${popupString['million_dollar']}</strong></p>` +
              `<p>${popupString['project_type']} <strong>` + d.value.project_type + '</strong></p>' +
              `<p>${popupString['sector']} <strong>` + d.value.sector + '</strong></p>';
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
      .externalLabels(500)
      .legend(dc.legend()
        .gap(Math.round(projectsBySectorPieChart.height() * 0.03, 1))
        .highlightSelected(true)
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
      .slicesCap(7)
      .useViewBoxResizing(true)
      .innerRadius(40)
      .externalLabels(500)
      // .ordinalColors(["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"])
      .legend(dc.legend()
        .gap(Math.round(projectsByProvincePieChart.height() * 0.03, 1))
        .highlightSelected(true)
        .autoItemWidth(true)
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

    const columns_en = [
      {
        title : 'Project Name',
        data  : d => d.project_name
      },
      {
        title : 'Development project',
        data  : d => d.project_type
      },
      {
        title : 'Project developer (Agency/Company)',
        data  : d => d.developer,
      },
      {
        title : 'Nationality of project (Country)',
        data  : d => d.nationality,
      },
      {
        title : 'Capital investment (millions USD)',
        data  : d => d.investment_mm,
      },
      {
        title : 'Started year',
        data  : d => d.year_start,
      },
      {
        title : 'Project location',
        data  : d => d.province,
      }
    ]

    const columns_km = [
      {
        title : 'ឈ្មោះគម្រោង',
        data  : d => d.project_name
      },
      {
        title : 'គម្រោងអភិវឌ្ឍន៍',
        data  : d => d.project_type
      },
      {
        title : 'អ្នកអភិវឌ្ឍន៍គម្រោង (ទីភ្នាក់ងារ/ក្រុមហ៊ុន)',
        data  : d => d.developer,
      },
      {
        title : 'ប្រទេសអភិវឌ្ឍគម្រោង',
        data  : d => d.nationality,
      },
      {
        title : 'ទុនវិនិយោគ (លានដុល្លារ)',
        data  : d => d.investment_mm,
      },
      {
        title : 'គម្រោងចាប់ផ្តើម',
        data  : d => d.year_start,
      },
      {
        title : 'ទីតាំងគម្រោង',
        data  : d => d.province,
      }
    ]

    const columns = (document.documentElement.lang == 'en') ? columns_en : columns_km;

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
      .enableHeader(true)
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
      .buttons(["csv", "excel", "print"])

    dc.renderAll();
  })
} catch (error) {
  console.log(error)
}
