# Script to convert tiff to bathymetry contour mbtiles

**proof of concept**

![sample](images/bathymetry_sample.gif)


## Install

- `brew install tippecanoe`
- `npm install`

## Data preprocessing

1. Download SRTM data from http://www.shadedrelief.com/cleantopo2/
2. Replace value above 10000 by nulls. In GRASS : `r.mapcalc expression="clean_topo_ocean = clean_topo > 10000 ? null() : 10000 - clean_topo" --overwrite`
3. Export as geotiff

## Usage

1. Put tiff in './in' folder
2. node index.js
3. Output will be in '/out' folder

