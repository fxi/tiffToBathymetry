const fs = require('fs');
const d3 = require('d3-contour');
const GeoTIFF = require('geotiff');
const path = require('path');
const tippecanoe = require('tippecanoe').tippecanoeAsync;

let w, h, lat, lng, xMin, xMax, yMin, yMax, res, bbx;

const depths = [
  0,
  100,
  500,
  1000,
  2000,
  3000,
  4000,
  5000,
  6000,
  7000,
  8000,
  9000,
  10000
];

const inFolder =  path.resolve('./in');
const outFolder = path.resolve('./out');

const inFile = path.join(inFolder,'bathymetry.tiff');
const outFileTiles = path.join(outFolder,'bathymetry.mbtiles');
const outFileGeoJSON = path.join(outFolder,'bathymetry.geojson');

buildJSON().then(() => {
  buildMbtiles();
});

function buildJSON() {
  return (async function() {
    const tiffBuff = fs.readFileSync(inFile);
    const tiffABuff = toArrayBuffer(tiffBuff);
    const tiff = await GeoTIFF.fromArrayBuffer(tiffABuff);
    const img = await tiff.getImage();
    const values = (await img.readRasters())[0];
    bbx = img.getBoundingBox();
    xMin = bbx[0];
    xMax = bbx[1];
    yMin = bbx[2];
    yMax = bbx[3];
    res = img.getResolution();
    w = img.getWidth();
    h = img.getHeight();
    const contours = d3
      .contours()
      .size([w, h])
      .smooth(false)
      .thresholds(depths);
    const geojson = {
      type: 'FeatureCollection',
      features: []
    };
    const geoms = contours(values);

    geoms.forEach((geom) => {
      geom.coordinates.forEach((group) => {
        group.forEach((coord) => {
          coord.forEach((c, i) => {
            coord[i] = pixTolatLng(c[0], c[1]);
          });
        });
      });
    });

    geojson.features = geoms;
    geojson.features = geojson.features.map(feature);
    fs.writeFileSync(outFileGeoJSON, JSON.stringify(geojson));
  })();
}

function buildMbtiles() {
  return tippecanoe(
    [outFileGeoJSON],
    {
      zg: true,
      readParallel: true,
      force: true,
      layer: 'bathymetry',
      output: outFileTiles,
      description: 'Bathymetry contours extracted with d3-contour'
    },
    {echo: true}
  );
}

function toArrayBuffer(buf) {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

function feature(geom, i) {
  return {
    type: 'Feature',
    properties: {depth: depths[i]},
    geometry: geom
  };
}

function pixTolatLng(y, x) {
  lat = x * res[1] - xMin / 2;
  lng = y * res[0] - yMin;

  return [lng, lat];
}
