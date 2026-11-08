/* Shared price calculator — reads every rate from config.js */
(function () {
  var FFC = (window.FFC = window.FFC || {});

  FFC.money = function (n) {
    return (
      "$" +
      Number(n).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    );
  };

  /* state: { service, property, frequency, beds, baths, sqftIndex, addons: { key: qty } } */
  FFC.calc = function (s) {
    var p = FFC.config.pricing;
    var svc = p.services[s.service] || p.services.standard;
    var prop = p.property[s.property] || p.property.house;
    var tier = p.sqftTiers[s.sqftIndex] || p.sqftTiers[0];

    var core =
      p.base +
      (s.beds || 0) * p.perBedroom +
      (s.baths || 1) * p.perBathroom +
      tier.add;
    var cleaning = core * svc.multiplier * prop.multiplier;

    var freq =
      s.service === "standard"
        ? p.frequency[s.frequency] || p.frequency.once
        : p.frequency.once;
    var discount = Math.round(cleaning * freq.discount);

    var addonLines = [];
    var addonTotal = 0;
    Object.keys(s.addons || {}).forEach(function (k) {
      var qty = s.addons[k];
      var a = p.addons[k];
      if (!a || !qty) return;
      var line = a.price * qty;
      addonTotal += line;
      addonLines.push({
        key: k,
        label: a.label,
        qty: qty,
        unit: a.unit,
        amount: line,
      });
    });

    cleaning = Math.round(cleaning);
    var total = cleaning - discount + addonTotal;
    var minApplied = false;
    if (total < p.minimumTotal) {
      total = p.minimumTotal;
      minApplied = true;
    }

    return {
      serviceLabel: svc.label,
      propertyLabel: prop.label,
      sizeLabel: tier.label,
      frequencyLabel: freq.label,
      cleaning: cleaning,
      discount: discount,
      discountRate: freq.discount,
      addonLines: addonLines,
      addonTotal: addonTotal,
      minApplied: minApplied,
      total: Math.round(total),
    };
  };

  /* "Starting from" price for the pricing page cards */
  FFC.fromPrice = function (service) {
    return FFC.calc({
      service: service,
      property: "apartment",
      frequency: "once",
      beds: 1,
      baths: 1,
      sqftIndex: 0,
      addons: {},
    }).total;
  };
})();
