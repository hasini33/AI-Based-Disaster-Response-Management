import os
from dotenv import load_dotenv

from sentinelhub import (
    SHConfig,
    SentinelHubRequest,
    DataCollection,
    MimeType,
    CRS,
    BBox,
)

load_dotenv()

config = SHConfig()
config.sh_client_id = os.getenv("CLIENT_ID")
config.sh_client_secret = os.getenv("CLIENT_SECRET")


def get_satellite_image(latitude, longitude):

    bbox = BBox(
        bbox=[
            longitude - 0.01,
            latitude - 0.01,
            longitude + 0.01,
            latitude + 0.01,
        ],
        crs=CRS.WGS84,
    )

    evalscript = """
    //VERSION=3

    function setup() {
      return {
        input: ["B04","B03","B02"],
        output: { bands: 3 }
      };
    }

    function evaluatePixel(sample) {
      return [sample.B04, sample.B03, sample.B02];
    }
    """

    request = SentinelHubRequest(
        evalscript=evalscript,
        input_data=[
            SentinelHubRequest.input_data(
                data_collection=DataCollection.SENTINEL2_L2A
            )
        ],
        responses=[
            SentinelHubRequest.output_response(
                "default",
                MimeType.PNG
            )
        ],
        bbox=bbox,
        size=(512, 512),
        config=config,
    )

    return request.get_data()