---
title: 구글 주소 검색으로 위 경도 조회
date: 2024-03-10T23:00+0900
---

[Google Maps Platform](https://mapsplatform.google.com/)을 통해 주소 또는 위 • 경도 정보를 조회할 수 있다. Places 또는 Geocoding API 모두에서 한국어를 포함한 다양한 언어에 대해 검색을 지원한다. 비록 국내 대상으로 사용할 수 있는 [우편번호 서비스](https://postcode.map.daum.net/guide)를 사용하는 것보다 자세한 정보를 가져오기는 힘들지만 국내 주소 뿐만 아니라 해외 주소나 위치에 대한 검색을 커버하기 위해서는 거의 대안이 없다고 생각된다. 또한, HTTP 요청을 직접 사용해서 구현하지 않아도 쉽게 적용할 수 있는 라이브러리가 있다.

- [Google Maps JavaScript API React Wrapper](https://github.com/googlemaps/react-wrapper)
- [Vue 3 Google maps](https://vue-map.netlify.app/)
- [Java Client for Google Maps Services](https://github.com/googlemaps/google-maps-services-java)

#### [FE] Vue 3 Google maps

```js
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import VueGoogleMaps from '@fawmi/vue-google-maps'

const app = createApp(App)
app.use(VueGoogleMaps, {
    load: {
        key: import.meta.env.VITE_GOOGLE_MAP_API_KEY,
        libraries: "places",
        language: 'ja'
    }
})
app.mount('#app')
```

```html
<GMapAutocomplete
    placeholder="Please input address"
    @place_changed="(result) => console.log(result)">
</GMapAutocomplete>
```

#### [BE] Java Client for Google Maps Services

```groovy build.gradle
dependencies {
    implementation 'com.google.maps:google-maps-services:2.2.0'
}
```

```java
@SpringBootTest
class GoogleMapTests {

    static final String apiKey = "";
    static final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    @Test
    void Test_Places() {
        Assertions.assertDoesNotThrow(() -> {
            GeoApiContext context = new GeoApiContext.Builder()
                    .apiKey(apiKey)
                    .queryRateLimit(10)
                    .build();
            PlaceAutocompleteRequest.SessionToken session = new PlaceAutocompleteRequest.SessionToken();

            String input = "강남역";
            AutocompletePrediction[] predictions = PlacesApi.placeAutocomplete(context, input, session).await();

            System.out.println(gson.toJson(predictions));
            context.shutdown();
        });
    }

}
```

#### Place Autocomplete 최적화

Places API 와 Geocoding API 모두 [사용한 만큼 지불하는 가격 모델](https://developers.google.com/maps/documentation/geocoding/usage-and-billing)을 가지므로 [Place Autocomplete 최적화](https://developers.google.com/maps/documentation/places/web-service/autocomplete) 와 [주소 지오코딩 권장사항](https://developers.google.com/maps/documentation/geocoding/best-practices) 같은 정보가 도움이 될 수 있다. 주소에 대한 자세한 정보가 필요한 것이 아닌 주소 및 위치 정보만 필요로 하는 경우에는 아래의 항목을 체크해보도록 하자.

- 주소와 위치 정보만을 필요로 한다면 Place Autocomplete 보다는 Geocoding API가 효율적이다.
- 사용자가 원하는 주소를 명확하게 알고 있다면 Geocoding API를 사용하는게 좋다.

```java
@SpringBootTest
class GoogleMapTests {

    static final String apiKey = "";
    static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    static GeoApiContext context;

    @BeforeAll
    static void contextLoads() {
        context = new GeoApiContext.Builder()
                .apiKey(apiKey)
                .queryRateLimit(10)
                .build();
    }
    
    @Test
    void Test_Geocoding() {
        Assertions.assertDoesNotThrow(() -> {
            String address = "강남역";
            GeocodingResult[] results =  GeocodingApi.geocode(context, address)
                    .language("ko")
                    .locationType(LocationType.ROOFTOP)
                    .resultType(AddressType.STREET_ADDRESS)
                    .await();

            System.out.println(gson.toJson(results));
            context.shutdown();
        });
    }

}
```

#### Samples

- [Geocoding Service](https://developers.google.com/maps/documentation/javascript/examples/geocoding-simple)
- [Reverse Geocoding](https://developers.google.com/maps/documentation/javascript/examples/geocoding-reverse)
- [Get the Address for a Place ID](https://developers.google.com/maps/documentation/javascript/examples/geocoding-place-id)
- [Place Autocomplete](https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete)
- [Place Details](https://developers.google.com/maps/documentation/javascript/examples/place-details)