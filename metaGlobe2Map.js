var mapWidth = 960,
    mapHeight = 500,
    focused = false,
    ortho = true,
    speed = -7e-3,
    start = Date.now(),
    corr = 0;

var projectionGlobe = d3.geo.orthographic()
    .scale(240)
    .translate([mapWidth / 2, mapHeight / 2])
    .clipAngle(90);

var projectionMap = d3.geo.equirectangular()
    .scale(145)
    .translate([mapWidth / 2, mapHeight / 2])

var projection = projectionGlobe;

var path = d3.geo.path()
    .projection(projection);

var svgMap = d3.select("div#map")
    .classed("container", true)
    .append("svg")
        //responsive SVG needs these 2 attributes and no width and height attr
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 10 1000 500")
        //class to make it responsive
    .classed("svg-content-responsive", true);





var ocean = svgMap.append("path")
    .datum({type: "Sphere"})
    .attr("class", "background")
    .attr("d", path);




var zoneTooltip = d3.select("div#map").append("div").attr("class", "zoneTooltip"),
    infoLabel = d3.select("div#map").append("div").attr("class", "infoLabel");

var g = svgMap.append("g");

//Starter for function AFTER All transitions

function endall(transition, callback) {
    var n = 0;
    transition
        .each(function() { ++n; })
        .each("end", function() { if (!--n) callback.apply(this, arguments); });
}
var v0,r0,q0;
function dragstarted() {
    timer.stop();
    v0 = versor.cartesian(projection.invert(d3.mouse(this)));
    r0 = projection.rotate();
    q0 = versor(r0);
}

function dragged() {
    var v1 = versor.cartesian(projection.rotate(r0).invert(d3.mouse(this))),
        q1 = versor.multiply(q0, versor.delta(v0, v1)),
        r1 = versor.rotation(q1);
    projection.rotate(r1);
}
function scale() {
    width = document.documentElement.clientWidth;
    height = document.documentElement.clientHeight;
    svgMap.attr('width', width).attr('height', height);
    projection
        .scale((scaleFactor * Math.min(width, height)) / 2)
        .translate([width / 2, height / 2]);

}



//Loading data
queue()
    .defer(d3.json, "world.json")
    .defer(d3.tsv, "names.tsv")
    .await(ready);

svgMap.call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged));
function ready(error, world, countryData) {

    var countryById = {},
        countries = topojson.feature(world, world.objects.countries).features;

    //Adding countries by name

    countryData.forEach(function(d) {
        countryById[d.id] = d.name;
    });


    //Drawing countries on the globe

    const colorCountry = ['#3F1715', '#CE3C15', '#9A3F44', '#EFCF21', '#534B7C'];

    var world = g.selectAll("path").data(countries);

    world.enter().append("path")
        .attr("class", "mapData")
        .attr("d", path)
        .style("fill", () => colorCountry[Math.floor(Math.random() * 4) + 1])
        .classed("ortho", ortho = true);


    //Events processing

    world.on("mouseover", function(d) {
        if (ortho === true) {
            infoLabel.text(countryById[d.id])
                .style("display", "inline");

        } else {
            zoneTooltip.text(countryById[d.id])
                .style("left", (d3.event.pageX + 7) + "px")
                .style("top", (d3.event.pageY - 15) + "px")
                .style("display", "block");
        }
    })
        .on("mouseout", function(d) {
            if (ortho === true) {
                infoLabel.style("display", "none")

            } else {
                zoneTooltip.style("display", "none");
            }
        })

        .on("mousemove", function() {
            if (ortho === false) {
                zoneTooltip.style("left", (d3.event.pageX + 7) + "px")
                    .style("top", (d3.event.pageY - 15) + "px");

            }

        })

        .on("click", function(d) {
            if (focused === d) return reset();
            g.selectAll(".focused").classed("focused", false);
            d3.select(this).classed("focused", focused = d);
            infoLabel.text(countryById[d.id])
                .style("display", "inline");
            alert(countryById[d.id]);

            //Transforming Globe to Map

            /*if (ortho === true) {
                corr = projection.rotate()[0]; // <- save last rotation angle
                g.selectAll(".ortho").classed("ortho", ortho = false);
                projection = projectionMap;
                path.projection(projection);
                g.selectAll("path").transition().duration(3000).attr("d", path);
            }*/

        });

    //Globe rotating via timer

    d3.timer(function() {
        var λ = speed * (Date.now() - start);

        projection.rotate([λ + corr, -5]);
        g.selectAll(".ortho").attr("d", path);

    });

// functions for dragging
    function dragstarted() {
        gpos0 = projection.invert(d3.mouse(this));
        o0 = projection.rotate();
    }

    function dragged() {
        gpos1 = projection.invert(d3.mouse(this));
        o0 = projection.rotate();
        o1 = eulerAngles(gpos0, gpos1, o0);
        projection.rotate(o1);

        map.selectAll("path").attr("d", path);
    }

    //Adding extra data when focused

    function focus(d) {
        if (focused === d) return reset();
        g.selectAll(".focused").classed("focused", false);
        d3.select(this).classed("focused", focused = d);
    }

    //Reset projection

    function reset() {
        g.selectAll(".focused").classed("focused", focused = false);
        infoLabel.style("display", "none");
        zoneTooltip.style("display", "none");

        //Transforming Map to Globe

        projection = projectionGlobe;
        path.projection(projection);
        g.selectAll("path").transition()
            .duration(3000).attr("d", path)
            .call(endall, function() {
                g.selectAll("path").classed("ortho", ortho = true);
                start = Date.now(); // <- reset start for rotation
            });
    }



}

