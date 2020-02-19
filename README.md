# guembe-pos-server
Guembe POS Server

# SAP UDF

# User Password
U_GMBPOS_Password

# Sales Point ID
U_GMBPOS_SalesPointID

# Sales Point Date SaleNum
U_GMBPOS_Serial

# Document Type
U_GMBPOS_Type
    0    none
    1    Quick Sale
    2    Table (Open)
    3    Table (Closed)


## Building and transfering an image in production

### 1. Build & Save the production docker image

```sh
# build image for production
docker-compose -f docker-compose.yml build
# find image id
docker images
# save image
docker save <IMAGE_ID> --output dist/<image.tag>.tar
```

### 2. Load and tag Image in production environment

```sh
sudo docker load --input path/to/<image.tag>.tar
# find image id
sudo docker images
# tag image
sudo docker tag <IMAGE_ID> <image:tag>
```