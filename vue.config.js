const mobilePort = '8080'

module.exports = {
  devServer: {
    //   proxy: {
    //     '/isp': {
    //       agent: process.env.AGENT && new ProxyAgent('socks5://192.168.5.219:1080'),
    //       target: baseUrl,
    //       ws: true,
    //       changeOrigin: true,
    //     },
    //     '/websocket': {
    //       agent: process.env.AGENT && new ProxyAgent('socks5://192.168.5.219:1080'),
    //       target: baseUrl,
    //       ws: true,
    //       changeOrigin: true,
    //     },
    //     'geoserver/*|mapbox/*': {
    //       agent: process.env.AGENT && new ProxyAgent('socks5://192.168.5.219:1080'),
    //       target: 'http://192.168.10.111:8080/',
    //       ws: true,
    //     },
    //   },
    port: mobilePort,
  },
}
