/**
 * Created by tle1925 on 4/16/2016.
 */

// --> CREATE SVG DRAWING AREA
var width = 2000,
    height = 1000;

var USmap;
var timeuse;

// Map data by states
var dataByStates = d3.map();

queue()
    .defer(d3.json, "data/us-geo.json")
    .defer(d3.csv, "data/choropleth_new.csv", processData)
    .await(loaded);

var svg = d3.select("#visualization").append("svg")
    .attr("width", width)
    .attr("height", height)


function processData(d) {
    console.log(d);
    d.average_work= +d.average_work;
    d.average_leisure= +d.average_leisure;
    d.average_pcare= +d.average_pcare;
    d.average_educ= +d.average_educ;
    return d;
}

function loaded(error,map,data) {
    USmap=map;
    timeuse=data;

    updateMap();
}

var projection = d3.geo.albersUsa()
    .scale(1000)
    .translate([width/2.5, height /4]);

var path = d3.geo.path()
    .projection(projection);


// Create color scale
var colors = ["#fef0d9","#fdd49e","#fdbb84","#fc8d59","#e34a33","#b30000"];
// set up a scale that can take data values as input, and will return colors
var color = d3.scale.linear()
    .range(colors);


// Upon hovering, show text
function getText(d,selectedValue) {
    console.log(d.properties);
    return("<p style='font-size: 20px; text-transform: uppercase;'>" + d.properties.NAME +"</p>" +
    "<p>" + selectedValue + ": " + d3.round(d.properties[selectedValue],2)+ " min</p>");
}

function updateMap(){

    // Exit previous objects
    s=d3.selectAll("path.countries")
    s.remove();

    s1=d3.selectAll(".rectangles")
    s1.remove()

    s2=d3.selectAll(".legend-labels")
    s2.remove()

    // Get selected value
    selectedValue=d3.select("#map-type").property("value");
    // Get selected value

    var min=d3.min(timeuse, function(d) {return +d[selectedValue]})
    var max=d3.max(timeuse, function(d) {return +d[selectedValue]})

    // Pass in domain for color scale
    //colorScale.domain(d3.range(min, max, (max-min)/colors.length));
    color.domain(d3.range(min, max, (max-min)/colors.length));

    // Save these labels for legend
    var leg_labels=d3.range(min, max, (max-min)/colors.length);
    var US = USmap.features

    // Reference: http://chimera.labs.oreilly.com/books/1230000000345/ch12.html#_choropleth
    // Merge the malaria data and GeoJSON
    for(var i=0; i<timeuse.length; i++){

        //Grab country code, which matches with adm0_a3_is
        var dataCode = timeuse[i].states;

        //Find the corresponding country inside the GeoJSON
        for (var j = 0; j < US.length; j++) {
            var jsonCode = US[j].properties.NAME;
            //console.log(dataCode, jsonCode);
            if (dataCode == jsonCode) {
                //Copy the data value into the JSON
                US[j].properties[selectedValue]= timeuse[i][selectedValue];
                //Stop looking through the JSON
                break;
            }
        }
    }

    // Draw tip
    tip1 = d3.tip().attr('class', 'd3-tip').html(function(d) {
        return (getText(d,selectedValue));
    });

    svg.call(tip1)

    //console.log(US);
    svg.selectAll('path.countries')
        .data(US)
        .enter()
        .append('path')
        .attr('class', 'countries')
        .attr('d', path)
        .attr('fill', function(d,i) {
            if(!isNaN(d.properties[selectedValue])){
                return color(d.properties[selectedValue]);
            }
            return "#e5e5e5";
        })
        .on('mouseover', tip1.show)
        .on('mouseout', tip1.hide)


    // Create legend
    var legend = svg.selectAll('rect')
        .data(leg_labels)
        .enter()
        .append('rect')
        .attr("class", "rectangles")
        .attr("x", 0)
        .attr("y", function(d, i){
            return i*40;
        })
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", function(d){
            return color(d);
        });


    // Draw gray box for no data
    legend
        .data("No data")
        .enter()
        .append('rect')
        .attr("class", "rectangles")
        .attr("x", 0)
        .attr("y", leg_labels.length*40)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", "#e5e5e5")

    // Add labels for legend
    svg.selectAll("text")
        .data(leg_labels)
        .enter()
        .append('text')
        .attr("class", "legend-labels")
        .attr("x", 40)
        .attr("y", function(d, i) {
            return i*40+15;
        })
        .text(function(d,i) {
            format=d3.format(".1f")
            if(i<(leg_labels.length-1)){
                return ((format(leg_labels[i]))+ "-" + (format(leg_labels[i+1])));
            }
            return ((format(leg_labels[i])) + "-" + (format(max)));
        });

    // Append No Data in Legend
    svg.selectAll("text")
        .data("No data")
        .enter()
        .append("text")
        .attr("class", "legend-labels")
        .attr("x", 40)
        .attr("y", leg_labels.length*40 + 15)
        .text("No Data")



}

