const estate_url = 'https://www.land.mlit.go.jp/webland/api/TradeListSearch?from=20211&to=20214&city=26100';

// const YAHOO_GET_url = `https://map.yahooapis.jp/geocode/V1/geoCoder?output=json&appid=${yahoo-app-id}&query=${address-query}&callback=${callback}`;


// とりあえずcallbackは書かないでおく。最後に書くかもね





const result = document.getElementById('result');
const button = document.getElementById('button');
const setAPI = document.getElementById('key-set');
const resetAPI = document.getElementById('key-reset');


// ソート時の処理
const sort = function(entity_data) {
    const price_order = document.sort.order.value;
    const data = entity_data["data"];
    const periods = ["2021年第１四半期","2021年第２四半期","2021年第３四半期","2021年第４四半期"];

    switch (price_order) {
        case "high-order":
            return data.sort(function(a, b) {
                return parseFloat(b.TradePrice) - parseFloat(a.TradePrice);
            });
            case "low-order":
                return data.sort(function(a, b) {
                    return parseFloat(a.TradePrice) - parseFloat(b.TradePrice);
            });
        case "new-order":
            return data.sort(function(a, b) {
                return periods.indexOf(b.Period) - periods.indexOf(a.Period);
            });
        case "old-order":
            return data.sort(function(a, b) {
                return periods.indexOf(a.Period) - periods.indexOf(b.Period);
            });
    };
};

// データを出力する処理
const describeData = function(sorteddata) {
    result.innerHTML = '';
    for (let i = 0, number = sorteddata.length; i < number, i < 30; i++) {
        const contentDiv = document.createElement('div')
        result.appendChild(contentDiv);
        const contentnum = document.createElement('div');
        contentnum.textContent = `Num ${i + 1} -------`;
        contentDiv.appendChild(contentnum);

        const content1 = document.createElement('div');
        content1.textContent = 
        `取引種別：${sorteddata[i].Type}
        取引価格：${Number(sorteddata[i].TradePrice).toLocaleString()}
        坪単価：${Number(sorteddata[i].PricePerUnit) || "不明"}
        取引時期：${sorteddata[i].Period}`;
        contentDiv.appendChild(content1);

        const content2 = document.createElement('div');
        content2.textContent = 
        `住所：${sorteddata[i].Prefecture + sorteddata[i].Municipality + sorteddata[i].DistrictName}
        構造：${sorteddata[i].Structure || "不明"}`;
        contentDiv.appendChild(content2);
        // 坪単価と構造の部分でundefinedが出る 改善！！

        const weatherbutton = document.createElement("button");
        weatherbutton.value = `${sorteddata[i].Prefecture}${sorteddata[i].Municipality}${sorteddata[i].DistrictName}`;
        // 京都府京都市北区出雲路神楽町みたいになっているはず...
        weatherbutton.textContent = "この地点の天気を表示";
        addAPIEvent(weatherbutton)
        contentDiv.appendChild(weatherbutton);
    }
}

// 天気のやつかな？
const addAPIEvent = function(ele) {
    ele.addEventListener('click', () => {
        // const al = ele.value;
        // const yahoo_app_id = storage['yahoo_api_appID'];
        // const YAHOO_GET_url = `https://map.yahooapis.jp/geocode/V1/geoCoder?output=json&appid=${yahoo_app_id}&al=${al}`;

        // var callbackName = 'jsonpCallback' + Math.random().toString(16).slice(2);

        // const YAHOO_GET_url = `https://map.yahooapis.jp/geocode/V1/geoCoder?output=json&appid=${yahoo_app_id}&al=${al}&callback=${callbackName}`;


        // const myHeaders = new Headers();
        // myHeaders.append('Access-Control-Allow-Origin', "*");

        // var script = document.createElement('script');
        // script.src = YAHOO_GET_url;
        // document.body.appendChild(script);

        // fetch(YAHOO_GET_url, 
        //     {
        //     method: 'GET',
        //     // mode: "no-cors",
        //     headers: {"Access-Control-Allow-Origin": "*"},
        // }
        // )

        // jsの関数ひょうき
        // function console(data) {
        //     console.log("aiueo");
        // }
        // const console = function(data) {
        //     console.log("aiueo");
        // }
        // const console = data => {
        //     console.log('aiueo');
        // }

        loadYOLPJSONP(ele.value)
        .then(data => {
            return editCoordinates(data);
        })
        // これだとうまくいかなかった
        // なぜ？
        // 具体的には以下のresの値がundefinedと表示される
        // return editCoordinates(data)としたらうまくいった
        
        // .then(editCoordinates)
        // これは普通にうまくいった
        .then(res => {
            console.log(res);
            console.log(res.lon, res.lat);
            return getWeatherAPI(res.lon, res.lat);
        })
        .then(res => {
            console.log(res);
            const weatherDiv = document.createElement("div");
            const weatherImg = document.createElement("img");
            weatherImg.src = res.iconURL;
            const weatherContentP = document.createElement('p');
            weatherContentP.textContent = `天気：${res.weather} 気温：${res.temperature}`;

            weatherDiv.appendChild(weatherContentP);
            weatherDiv.appendChild(weatherImg);

            ele.parentNode.appendChild(weatherDiv);
        });
    });
};

const loadYOLPJSONP = (value) => {
    // 特定の文字列が入ると検索が失敗するためより広い区で検索
    // if(addressQuery.includes('学区')) {
    //     addressQuery = addressQuery.slice(0, addressQuery.indexOf("区")+1)
    // };
    // const encodeQuery = encodeURIComponent(addressQuery);
    // const api_url = `${YAHOO_GET_url}${storage["YAHOO_APPID"]}&query=${encodeQuery}&callback=${callbackName}`;

    const al = value;
    const yahoo_app_id = storage['yahoo_api_appID'];
    var callbackName = 'jsonpCallback' + Math.random().toString(16).slice(2);

    const YAHOO_GET_url = `https://map.yahooapis.jp/geocode/V1/geoCoder?output=json&appid=${yahoo_app_id}&al=${al}&callback=${callbackName}`;

    const script = document.createElement('script');
    script.src = YAHOO_GET_url;
    document.body.appendChild(script);

    // jsonp を then できるように promise化
    return new Promise((resolve, reject) => {
        window[callbackName] = resolve;
        script.addEventListener('error', reject);
    }).then(response => {
        delete window[callbackName];
        document.body.removeChild(script);
        return Promise.resolve(response);
    }, err => {
        var msg = err ? 'Execution Failed' : 'Request Timeout';
        delete window[callbackName];
        document.body.removeChild(script);
        return Promise.reject('JSONP ' + msg + ': ' + api_url);
    });
};

const editCoordinates = function(data) {
    console.log(data.Feature[0].Geometry.Coordinates.split(','));
    const coordinates = data.Feature[0].Geometry.Coordinates.split(",");
    
    return {
        "lon": coordinates[0],
        "lat": coordinates[1]
    }
};

const getWeatherAPI = async function(lon, lat) {
    // const lon = lon;
    // const lat = lat;
    // const open_weather_map_api = storage["open_weather_map_api"];
    // const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weather_app_id}&lang=ja`;

    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${storage["open_weather_map_api"]}&lang=ja`;

    const res = await fetch(WEATHER_API_URL);
    const res_1 = await res.json();
    return {
        "weather": res_1.weather[0].description,
        "iconURL": `http://openweathermap.org/img/wn/${res_1.weather[0].icon}@2x.png`,
        "temperature": `${Math.round((res_1.main.temp - 273.15) * 10) / 10}°C`
    };
}

// 「結果を出力」を押した時の処理
document.getElementById("button").addEventListener("click", () => {
    result.textContent = '通信中...'
    fetch(estate_url)
    .then(response => {
        return response.json();
    })
    .then(data => {
        describeData(sort(data));
    });
});

// 「APIキーをセット」のボタンを押した時の処理
setAPI.addEventListener("click", () => {
    const yahooAPI = document.getElementById("yahoo_api_appID");
    const weatherAPI = document.getElementById("open_weather_map_api");
    storage.setItem('yahoo_api_appID', yahooAPI.value);
    storage.setItem('open_weather_map_api', weatherAPI.value);
});

resetAPI.addEventListener("click", () => {
    storage.clear();
});

// ストレージを作る処理
let storage = sessionStorage;


