var map;
var infoWindow;
var bounds;
var initialIcon;
var hoverIcon;

function apiError(){
  $("#map").text("Unable to load the map. Please try again later.")
}
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 49,
            lng: 8
        },
        zoom: 3,
        mapTypeControl: false,
        styles: [
                  {
                    "featureType": "poi",
                    "stylers": [
                      { "visibility": "off" }
                    ]
                  }
                ]
    });

    infoWindow = new google.maps.InfoWindow();
    infoWindow.addListener('closeclick', function() {
    infoWindow.marker = null;
    });
    bounds = new google.maps.LatLngBounds();
    initialIcon = new google.maps.MarkerImage(
        'img/init-marker.png',
        null,
        null,
        new google.maps.Point(17, 34),
        new google.maps.Size(34, 34));

    hoverIcon = new google.maps.MarkerImage(
        'img/hover-marker.png',
        null,
        null,
        new google.maps.Point(17, 34),
        new google.maps.Size(34, 34));

    ko.applyBindings(new AppViewModel());
}

var createMarker = function(data) {
    var markerItem = this;

    markerItem.title = data.title;
    markerItem.position = data.location;

    markerItem = getFoursquareData(markerItem);

    markerItem.visible = ko.observable(true);

    // Create a marker per location, and put into markers array
    markerItem.marker = new google.maps.Marker({
        position: markerItem.position,
        title: markerItem.title,
        animation: google.maps.Animation.DROP,
        icon: initialIcon
    });

    markerItem.filterMarkers = ko.computed(function() {
        // set marker and extend bounds (showListings)
        if (markerItem.visible() === true) {
            markerItem.marker.setMap(map);
            bounds.extend(markerItem.marker.position);
            map.fitBounds(bounds);
        } else {
            markerItem.marker.setMap(null);
        }
    });
    // Callback funtion for KO
    markerItem.show = function(location) {
        map.panTo(markerItem.marker.getPosition());
        createInfoWindowsLayout(markerItem.marker, markerItem, infoWindow);
        infoWindow.open(map, markerItem.marker);
    };
    // Click event for the map Marker
    markerItem.marker.addListener('click', function() {
        map.panTo(this.getPosition());
        createInfoWindowsLayout(this, markerItem, infoWindow);
        infoWindow.open(map, this);
    });
    // mouseHovering event for the map Marker
    markerItem.marker.addListener('mouseover', function() {
        this.setAnimation(google.maps.Animation.BOUNCE);
        this.setIcon(hoverIcon);
    });
    // mouseOver event for the map Marker
    markerItem.marker.addListener('mouseout', function() {
        this.setAnimation(null);
        this.setIcon(initialIcon);
    });


};
// KO view Model
var AppViewModel = function() {
    var self = this;
    this.sInput = ko.observable('');
    this.mapList = ko.observableArray([]);
    locations.forEach(function(location) {
        self.mapList.push(new createMarker(location));
    });

    // Filtering location item based on the sInput variable
    this.locationList = ko.computed(function() {
        var searchInput = self.sInput().toLowerCase();
        return ko.utils.arrayFilter(self.mapList(), function(location) {
            var inFilter = (!searchInput) || location.title.toLowerCase().includes(searchInput);
            location.visible(inFilter);
            return inFilter;
        });
        return self.mapList();
    }, self);
};

function createInfoWindowsLayout(marker, markerItem, infowindow) {
        infowindow.marker = marker;
        var contentString =
            '<div id="content">'+
              '<h3>' + printValue(markerItem.title) + '</h3>'+
              '<div id="bodyContent">'+
                '<p>' + printValue(markerItem.street) +
                        '<br>' +
                        printValue(markerItem.city) +
                        '<br>' +
                        printValue(markerItem.phone) +
                '</p>'+
              '</div>'+
            '</div>';
        infowindow.setContent(contentString);
}

var getFoursquareData = function(markerItem) {
    var clientID = 'XYRC2FECYK04KM4TODERCX20OCOMVPTRBWSTSLO1FS5NGA3W';
    var clientSecret = 'QUOBRX1CIHPX5WGV4BBNYTQUZP2A5QWHPORCG4KIEQWOZKBX';

    var FSReqURL = 'https://api.foursquare.com/v2/venues/search?ll=' + markerItem.position.lat + ',' + markerItem.position.lng + '&query=' + markerItem.title + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20180101';

    $.getJSON(FSReqURL).done(function(data) {
        if (data.response.venues.length > 0) {
            var results = data.response.venues[0];
            markerItem.title = results.name;
            markerItem.street = results.location.formattedAddress[0];
            markerItem.city = results.location.formattedAddress[1];
            markerItem.phone = results.contact.formattedPhone;
        }
    }).fail(function() {
        alert('Foursquare not available at the moment');
    });

    return markerItem;
}

function printValue(value){
  return value?value:"";
}
