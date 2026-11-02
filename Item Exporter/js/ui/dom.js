WS.el = (() => {
  const $ = WS.$;
  return {
    zipInput:$('zipFile'), scanBtn:$('scanBtn'), dimBtn:$('dimBtn'), dimMenu:$('dimMenu'), dimChecks:[...document.querySelectorAll('.dim-check')], excludeStructures:$('excludeStructures'),
    exportBtn:$('exportBtn'), exportMenu:$('exportMenu'), exportMinCheck:$('exportMinCheck'), exportMinValue:$('exportMinValue'), exportCount:$('exportCount'), exportXlsxBtn:$('exportXlsxBtn'), exportCsvBtn:$('exportCsvBtn'),
    navCta:$('navCta'), heroChoose:$('heroChoose'), ctaChoose:$('ctaChoose'),
    drop:$('drop'), dropTitle:$('dropTitle'), dropHint:$('dropHint'), fileName:$('fileName'),
    status:$('status'), results:$('results'), search:$('search'), containerResults:$('containerResults'),
    bar:$('bar'), track:$('track'), progressTitle:$('progressTitle'), progressPct:$('progressPct'), stateDot:$('stateDot'), stateText:$('stateText'),
    itemKinds:$('itemKinds'), itemCount:$('itemCount'), containers:$('containers'),
    distributionNote:$('distributionNote'), distributionBody:$('distributionBody'),
    distributionChartScroll:$('distributionChartScroll'), itemBarChart:$('itemBarChart')
  };
})();
