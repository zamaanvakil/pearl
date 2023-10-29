// set the dimensions and margins of the graph
const margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

const emotions = ["anger", "fear", "anticipation", "trust", "surprise", "sadness", "joy", "disgust"]

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//Read the data
d3.csv("POTUS.csv", function(d) {
        if (d.Segment_ID == 1) {return d;}})
    .then(function(data) {
        
    var pie = d3.pie()
        .value(function(d) {return d[1];});

    pie_data = [];
    for (var i = 0; i < data.length; i++) {
        for (const [key, value] of Object.entries(JSON.parse(data[i].Words_VAD_Emotion))) {
            temp = pie(Object.entries(Object.assign({}, value.emotion)));
            temp = temp.filter(o => o.startAngle != o.endAngle);
            temp.forEach(function(d) {
                d.key = key;
                d.valence = value.valence;
                d.arousal = value.arousal;
                d.dominance = value.dominance;
                d.emotion = value.emotion;
            });
            pie_data = pie_data.concat(temp);
        }
    }

    // Add X axis
    var x = d3.scaleLinear()
        .domain([0, 1])
        .range([ 0, width ]);
    svg.append("g")
        .attr("transform", "translate(0," + height/2 + ")")
        .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, 1])
        .range([ height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y))
        .attr("transform", "translate(" + width/2 + ", 0)");

    // X axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height/2 + margin.top + 20)
        .text("Arousal");

    // Y axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("y", margin.top - 5)
        .attr("x", width/2 - 40)
        .text("Valence")

    // Tooltip creation
    var tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    // Draw data
    const color = d3.scaleOrdinal(d3.schemeSet2); //temp color scale
    svg.selectAll('.pie')
        .data(pie_data)
        .join('path')
        .attr("class", "pie")
        .attr('d', d3.arc()
            .innerRadius(0)
            .outerRadius(function(d) {return Math.max(d.dominance*(Math.min(width, height) / 15 - 10), 6);})
        )
        .attr('fill', function(d) {return color(d.data[0]);})
        .attr('transform', function(d) { return 'translate(' + x(d.arousal) + ',' + y(d.valence) + ')';})
        .on("click", function(d, i) {
            if (d3.select(this).style("stroke-opacity") < 1) {
                svg.selectAll('.pie').style("stroke-opacity", 0);
                svg.selectAll('.pie').each(function(d) {
                    if(d.valence == i.valence && d.arousal == i.arousal) {
                        d3.select(this).style("stroke-opacity", 1);
                    }
                });
            }
            else { svg.selectAll('.pie').style("stroke-opacity", 0); }
        })
        .on("mouseover", function(d, i) {
            if (d3.select(this).style("stroke-opacity") == 0) {
                svg.selectAll('.pie').each(function(d) {
                    if(d.valence == i.valence && d.arousal == i.arousal) {
                        d3.select(this).style("stroke-opacity", 0.99);
                    }
                });
            }
            var emotionText = "";
            for (var j = 0; j < i.emotion.length; j++) {
                if (i.emotion[j] == 1) {
                    emotionText += emotions[j] + " ";
                }
            }
            const text = "<i>" + i.key + "</i><br><b>valence</b> " + i.valence + "<br><b>arousal</b> " + i.arousal + "<br><b>dominance</b> " + i.dominance + "<br><b>emotion</b> " + emotionText;
            tooltip.html(text)
                .style('opacity', .9)
                .style('left', (event.pageX+20) + 'px')
                .style('top', (event.pageY+20) + 'px');
        })
        .on("mousemove", function() {
            tooltip.style('top', event.pageY+20+'px')
                .style('left',event.pageX+20+'px');
        })
        .on("mouseout", function(d,i) {
            if (d3.select(this).style("stroke-opacity") == 0.99) {
                svg.selectAll('.pie').each(function(d) {
                    if(d.valence == i.valence && d.arousal == i.arousal) {
                        d3.select(this).style("stroke-opacity", 0);
                    }
                });
            }
            tooltip.html("")
                .style('opacity', 0)
                .style('left', -margin.left + 'px')
                .style('top', -margin.top + 'px');
        })
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("stroke-opacity", 0)
        .style("opacity", 0.7);
});