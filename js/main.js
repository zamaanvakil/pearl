var userDataArray = [];
var userTweetDataArray = [];
var streamGraphWidth = 0.5;
var container, svg, x, y, divTip, color, word_cloud, divTip_Area, keys;
const margin = {top: 20, right: 30, bottom: 30, left: 60};

const maxTweetCount = 80;
var dateRangeGlobal;

var word_tweet_mapping;
var tweet_word_mapping;
var tweet_date_mapping;
var selected_words;
var selected_tweet;

var segment_tweet_number;
var segment_selected;

// Scatterplot dimensions
const scatterplot_margin = {top: 10, right: 30, bottom: 30, left: 60}
var scatterplot_width = 460 - scatterplot_margin.left - scatterplot_margin.right;
var scatterplot_height = 400 - scatterplot_margin.top - scatterplot_margin.bottom;
var scatterplot_svg;
var scatterplot_tooltip;
var pie_data;

var svg_ChartA, xScale_ChartA, yScale_ChartA, xAxis_ChartA, yAxis_ChartA;

// marimekko chart
// let svg;
let svgMarimekkoChart;
let csvData1;
let csvData2; 
 
// Push JSON objects of structure Segment, Date, No. of tweets, Emotion
let finalJSON = [];

 // If you want finalJSON as an array bunched with rows
let fianlArr = {
    segment: [],
    date: [],
    tweetCount: [],
    stats: {
        arousal: [],
        valence: [],
        dominance: [],
        emotion: []
    }
}
let dataRect = [];

// var users_data
var users_segments = ["POTUS", "chrisbryanASU","elonmusk","h3h3productions","realDonaldTrump","MrBeast","MKBHD","hasanthehun","GretaThunberg","drewisgooden"]
var areaChartObject = {}, pieChartData = {}, lineChartDateArray= [];
var user = "POTUS";
var test;
document.addEventListener('DOMContentLoaded', function () {
  
  keys = ["anger","fear","anticipation","trust","suprise","sadness","joy","disgust"];
    
    Promise.all([d3.csv('model/tweet_dataset/POTUS_segment.csv'),
                d3.csv('model/tweet_dataset/chrisbryanASU_segment.csv'),
                d3.csv('model/tweet_dataset/elonmusk_segment.csv'),
                d3.csv('model/tweet_dataset/h3h3productions_segment.csv'),
                d3.csv('model/tweet_dataset/realDonaldTrump_segment.csv'),
                d3.csv('model/tweet_dataset/MrBeast_segment.csv'),
                d3.csv('model/tweet_dataset/MKBHD_segment.csv'),
                d3.csv('model/tweet_dataset/hasanthehun_segment.csv'),
                d3.csv('model/tweet_dataset/GretaThunberg_segment.csv'),
                d3.csv('model/tweet_dataset/drewisgooden_segment.csv'),
                d3.csv('model/tweet_dataset/POTUS.csv'),
                d3.csv('model/tweet_dataset/chrisbryanASU.csv'),
                d3.csv('model/tweet_dataset/elonmusk.csv'),
                d3.csv('model/tweet_dataset/h3h3productions.csv'),
                d3.csv('model/tweet_dataset/realDonaldTrump.csv'),
                d3.csv('model/tweet_dataset/MrBeast.csv'),
                d3.csv('model/tweet_dataset/MKBHD.csv'),
                d3.csv('model/tweet_dataset/hasanthehun.csv'),
                d3.csv('model/tweet_dataset/GretaThunberg.csv'),
                d3.csv('model/tweet_dataset/drewisgooden.csv')])
         .then(function (values) {

          /** Push user data into an array */
          for(let x = 0; x < 10; x++){
            userDataArray.push(values[x]);
          }

          /** Push user tweet data into an array */
          for(let x = 10; x < 20; x++){
            userTweetDataArray.push(values[x]);
          }

          test = values[0];

          /** Data aggregation for area chart creation */
          for(let k = 10; k < 20; k++){
            var areaChartData = [];
            var file_data = values[k];
            var map = new Map();
            for(let i = 0; i < 8; i++){
              map.set(keys[i], new Map());
            }
            for(let i = 0; i < file_data.length; i++)
            {
              var temp = JSON.parse(file_data[i].Words_VAD_Emotion);
              const section = parseInt(file_data[i].Segment_ID);
              if(areaChartData.length == section){
                areaChartData.push({"map" : new Map(), "tweet_count" : 0,"count" : 0, "date": new Date(file_data[i]["DateTime"].split(" ")[0]), Segment_ID : section});
              }
              var object = areaChartData[section];
              object.tweet_count++;
              Object.entries(temp).forEach((element) => {
                  if(object.map.has(element[0])){
                    object.map.set(element[0], object.map.get(element[0]) + 1);
                  }else{
                    object.map.set(element[0], 1);
                  }
                  object.count++
                  var emotionArray = element[1].emotion;
                  for(let k = 0; k < emotionArray.length; k++){
                    if(emotionArray[k] == 1){
                      var emotionMap = map.get(keys[k]);
                      if(emotionMap.has(element[0])){
                        emotionMap.set(element[0], emotionMap.get(element[0]) + 1);
                      }else{
                        emotionMap.set(element[0], 1);
                      }
                    }
                  }
              });
            }
            areaChartObject[users_segments[k - 10]] = areaChartData;
            pieChartData[users_segments[k - 10]] = map;
          }

          console.log("Load user data from the csv files");

          divTip_Area = d3.select("body").append("div")
            .attr("class", "tooltip_area")
            .style("border", "1px solid white")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("opacity", 0)

          // Scatterplot tooltip creation
          scatterplot_tooltip = d3.select('body').append('div')
            .attr('class', 'scatterplot_tooltip')
            .style('opacity', 0);

          
          color = d3.scaleOrdinal().domain(keys).range(['#eb4034','#3bb347','#fa7916','#07f566','#07f5f1','#86b5cf','#f7f707','#8b07f7']);

          drawLineChart();
          drawStreamGraph(null);
          drawMarimekkoChart();
          //aggregatedPieChart();
            

            }); 
        });



function updateSelectedUser(){
  d3.select("#scatterplot_svg").selectAll("*").remove();
  d3.select("#marimekkoChart").selectAll("*").remove();
  user=document.getElementById("user").value;
  console.log("selected user "+user);
  drawLineChart();
  drawStreamGraph(null);
  drawMarimekkoChart();
  document.getElementById("tweetList").innerHTML="";
}

function getSelectedUserData(){
  var u1Data=[];
  selected_user=document.getElementById("user").value;
  const userIndex = users_segments.indexOf(selected_user);
  u1Data = userDataArray[userIndex];
  // if (user==="POTUS")

  var arrObj=[];
  for (let i = 0; i < u1Data.length; i++) {
    if(Object.keys(JSON.parse(u1Data[i]['Segment_VAD_Emotion'])).length!=0){
        arrObj.push({"date":new Date(u1Data[i]["DateTime"].split(" ")[0]),
        "valence":JSON.parse(u1Data[i]['Segment_VAD_Emotion']).valence,
        "arousal":JSON.parse(u1Data[i]['Segment_VAD_Emotion']).arousal,
        "dominance":JSON.parse(u1Data[i]['Segment_VAD_Emotion']).dominance,
        "anger":JSON.parse(u1Data[i]['Segment_VAD_Emotion']).emotion[0],
        "fear":JSON.parse(u1Data[i]['Segment_VAD_Emotion']).emotion[1],
        "anticipation":JSON.parse(u1Data[i]['Segment_VAD_Emotion']).emotion[2],
        "trust":JSON.parse(u1Data[i]['Segment_VAD_Emotion']).emotion[3],
        "suprise":JSON.parse(u1Data[i]['Segment_VAD_Emotion']).emotion[4],  
        "sadness":JSON.parse(u1Data[i]['Segment_VAD_Emotion']).emotion[5],
        "joy":JSON.parse(u1Data[i]['Segment_VAD_Emotion']).emotion[6],
        "disgust":JSON.parse(u1Data[i]['Segment_VAD_Emotion']).emotion[7],
        "total_sum_emotions": JSON.parse(u1Data[i]['Segment_VAD_Emotion']).emotion.reduce((partialSum, a) => partialSum + a, 0),
        "circle_packing_data":JSON.parse(u1Data[i]["Emotion_VAD"]),
        "segment_id": JSON.parse(u1Data[i]['Segment_ID'])             
        });
    }
  };


  return arrObj
}

// Marimekko Chart
function marimekkoData(){
  finalJSON = [];

 // If you want finalJSON as an array bunched with rows
  fianlArr = {
      segment: [],
      date: [],
      tweetCount: [],
      stats: {
          arousal: [],
          valence: [],
          dominance: [],
          emotion: []
      }
  }
  dataRect = [];

  selected_user=document.getElementById("user").value;
  const userIndex = users_segments.indexOf(selected_user);
  // console.log(userIndex);
 

  
  csvData1 = userTweetDataArray[userIndex];
  csvData2 = userDataArray[userIndex];
  // console.log(csvData1);
  // console.log(csvData2);

  let currentDate1;
  let currentDate2;

  // For loop for stats from csv2
  // for(let i=0; i<csvData2.length; i++){
  var curIndex=-1
  let startIndex=0;
  if (csvData2.length <10){
    startIndex=0;

  }
  else{
    startIndex=csvData2.length-10;
  }
  for(let i=startIndex; i<csvData2.length; i++){  // Enter how many days you want here!      
      currentDate2=csvData2[i].DateTime.split(" ")[0];
      curIndex+=1

      finalJSON.push({
          Segment: curIndex,
          Date: currentDate2,
          TweetCount: 0,
          WordCount: 0,
          Words: [],
          WordEmotion: {
              Anger: [],
              Fear: [],
              Anticipation: [],
              Trust: [],
              Surprise: [],
              Sadness: [],
              Joy: [],
              Disgust: []
          },
          Stats: {
              arousal: JSON.parse(csvData2[i].Segment_VAD_Emotion).arousal,
              valence: JSON.parse(csvData2[i].Segment_VAD_Emotion).valence,
              dominance: JSON.parse(csvData2[i].Segment_VAD_Emotion).dominance,
              emotion: JSON.parse(csvData2[i].Segment_VAD_Emotion).emotion
          },
          SumOfEmotions: 0
      });

      let countTweets=0;
      let tempDate='';

      // New for loop to compute SumOfEmotions and add to finalJSON
      for(let k=0; k<finalJSON[0].Stats.emotion.length; k++){
          finalJSON[curIndex].SumOfEmotions = finalJSON[curIndex].SumOfEmotions + finalJSON[curIndex].Stats.emotion[k];
      }

      // For loop to take tweet count from csv1 based on segment dates in csv2(finalJSON)
      for(let j=0; j<csvData1.length; j++){
          currentDate1=csvData1[j].DateTime.split(" ")[0];

          if(currentDate1!=tempDate && countTweets!=0){
              finalJSON[curIndex].TweetCount=countTweets;
              break;
          }
          // Maintain a current temp Date
          tempDate=csvData1[j].DateTime.split(" ")[0];

          if( currentDate1==finalJSON[curIndex].Date ){
              // console.log("DATE MATCHED");
              countTweets=countTweets+1;
          }
      }

      let tempWordArr = [];
      let tempWordArr2 = [];
      let tempLen=0;
      let countTotalWords=0;
      // For Loop to add Total Words
      for(let j=0; j<csvData1.length; j++){
          currentDate1=csvData1[j].DateTime.split(" ")[0];

          if(currentDate1!=tempDate && countTotalWords!=0){
              finalJSON[curIndex].WordCount=countTotalWords;
              break;
          }

          // Maintain a current temp Date
          tempDate=csvData1[j].DateTime.split(" ")[0];

          if( currentDate1==finalJSON[curIndex].Date ){

              // Put logic to count words here
              // let tempWordStorage=[];
              // let tempwordJSON=[];
              tempLen=Object.keys( JSON.parse( csvData1[j].Words_VAD_Emotion ) ).length;
              // console.log(tempLen);
              // console.log(JSON.parse( csvData1[j].Words_VAD_Emotion ));

              finalJSON[curIndex].WordCount = finalJSON[curIndex].WordCount + tempLen;
              // console.log( "FINAL: " + finalJSON[i].WordCount )
              // console.log(Object.keys( JSON.parse( csvData1[j].Words_VAD_Emotion ) ))

              // tempWordArr = Object.keys( JSON.parse( csvData1[j].Words_VAD_Emotion ) );
              // // console.log( tempWordArr );

              // tempWordArr2.push( ...tempWordArr);
              // console.log( tempWordArr2 );

              // Push to the Words[] array
              finalJSON[curIndex].Words.push( 
                  ...Object.keys( JSON.parse( csvData1[j].Words_VAD_Emotion ) )
              );

              // Add emotion to words here
              let emotionJson = JSON.parse( csvData1[j].Words_VAD_Emotion );

              // tempWordArr.push(emotionJson);
              let tempKeys = Object.keys( emotionJson );
              
              // Loop through each word in 
              for(let d=0; d<Object.keys( emotionJson ).length; d++){
                  // For each of the 8 emotions
                  for(let e=0; e<8; e++){

                      let currentEmotionArr = emotionJson[tempKeys[d]].emotion;

                      // Push word to repective emotion array
                      if( currentEmotionArr[e]==1 ){
                          finalJSON[curIndex].WordEmotion[ Object.keys( finalJSON[curIndex].WordEmotion )[e] ].push( tempKeys[d] );
                          // Remove duplicates!
                          finalJSON[curIndex].WordEmotion[ Object.keys( finalJSON[curIndex].WordEmotion )[e] ] = [...new Set(finalJSON[curIndex].WordEmotion[ Object.keys( finalJSON[curIndex].WordEmotion )[e] ])]
                      }
                  }
              }
          }
      }
  }

  // Add row wise stats for each data
  for(let i=0; i<finalJSON.length; i++){
      fianlArr.segment.push( finalJSON[curIndex].Segment );
      fianlArr.date.push( finalJSON[curIndex].Date );
      fianlArr.tweetCount.push( finalJSON[curIndex].TweetCount );

      fianlArr.stats.arousal.push( finalJSON[curIndex].Stats.arousal );
      fianlArr.stats.valence.push( finalJSON[curIndex].Stats.valence );
      fianlArr.stats.dominance.push( finalJSON[curIndex].Stats.dominance );
      fianlArr.stats.emotion.push( finalJSON[curIndex].Stats.emotion );
  }

  console.log(finalJSON);
  // console.log(fianlArr);
  tweetCountSum=d3.sum(fianlArr.tweetCount);



}

function drawMarimekkoChart(){
  marimekkoData();
  // Format of array: [The single emotion wordcoutn across all days, total wordCount(non-repeating and only important), accumulative, JSON for that segment again]
  let temporaryArray=[];
  let dataRectTemp=[];
  let temporaryArray2=[];

  // Loop to make dataRect array
  for(let i=0; i<8; i++){ // i is each emotion
      temporaryArray=[];
      temporaryArray2=[];

      // New Array will have 10 columns. The number of days
      for(let j=0; j<finalJSON.length; j++){
          temporaryArray2=[];

          if(i==0){ // Anger
              temporaryArray.push([ finalJSON[j].Date ,finalJSON[j].WordEmotion.Anger , 0, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "anger" ]);
              temporaryArray2.push([ finalJSON[j].Date ,finalJSON[j].WordEmotion.Anger , 0, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "anger" ]);
          } else if(i==1){ // Fear
              temporaryArray.push([ finalJSON[j].Date, finalJSON[j].WordEmotion.Fear , finalJSON[j].WordEmotion.Anger.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "fear" ]);
              temporaryArray2.push([ finalJSON[j].Date, finalJSON[j].WordEmotion.Fear , finalJSON[j].WordEmotion.Anger.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "fear" ]);
          } else if(i==2){ // Anticipation
              temporaryArray.push([ finalJSON[j].Date,finalJSON[j].WordEmotion.Anticipation , finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "anticipation" ]);
              temporaryArray2.push([ finalJSON[j].Date,finalJSON[j].WordEmotion.Anticipation , finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "anticipation" ]);
          } else if(i==3){ // Trust
              temporaryArray.push([ finalJSON[j].Date, finalJSON[j].WordEmotion.Trust , finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "trust" ]);
              temporaryArray2.push([ finalJSON[j].Date, finalJSON[j].WordEmotion.Trust , finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "trust" ]);
          } else if(i==4){ // Surprise
              temporaryArray.push([ finalJSON[j].Date, finalJSON[j].WordEmotion.Surprise , finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "surprise" ]);
              temporaryArray2.push([ finalJSON[j].Date, finalJSON[j].WordEmotion.Surprise , finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "surprise" ]);
          } else if(i==5){ // Sadness
              temporaryArray.push([ finalJSON[j].Date, finalJSON[j].WordEmotion.Sadness , finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "sadness" ]);
              temporaryArray2.push([ finalJSON[j].Date, finalJSON[j].WordEmotion.Sadness , finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "sadness" ]);
          } else if(i==6){ // Joy
              temporaryArray.push([ finalJSON[j].Date , finalJSON[j].WordEmotion.Joy , finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "joy" ]);
              temporaryArray2.push([ finalJSON[j].Date , finalJSON[j].WordEmotion.Joy , finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "joy" ]);
          } else if(i==7){ // Disgust
              temporaryArray.push([ finalJSON[j].Date, finalJSON[j].WordEmotion.Disgust , finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "disgust" ]);
              temporaryArray2.push([ finalJSON[j].Date, finalJSON[j].WordEmotion.Disgust , finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length, finalJSON[j].WordEmotion.Fear.length+finalJSON[j].WordEmotion.Anger.length+finalJSON[j].WordEmotion.Anticipation.length+finalJSON[j].WordEmotion.Trust.length+finalJSON[j].WordEmotion.Surprise.length+finalJSON[j].WordEmotion.Sadness.length+finalJSON[j].WordEmotion.Joy.length+finalJSON[j].WordEmotion.Disgust.length, "disgust" ]);
          }
          dataRectTemp.push(temporaryArray2);
      }
      dataRect.push(temporaryArray);
  }

// Dimension of the Marimekko Chart
d3.select("#marimekkoChart").selectAll("*").remove();
const margin = {top: 60, right: 30, bottom: 160, left: 80};
const heightMarimekkoChart = 600 - margin.top - margin.bottom;
const widthMarimekkoChart = 1500- margin.left - margin.right;

var svgMarimekkoChart = d3.select("#marimekkoChart")
// .append("svg")
.attr("height",heightMarimekkoChart + margin.top + margin.bottom)
.attr("width", widthMarimekkoChart + margin.left + margin.right)
.append("g")
.attr("transform", `translate(${margin.left},${margin.top})`);

// Final Data - Data Preprocessing
var finalData=[];
for(let i=0;i<dataRectTemp.length;i++){
  for (let j=0; j<dataRectTemp[i].length;j++){
      // console.log(dataRectTemp[i][j]);
      finalData.push(dataRectTemp[i][j])
  }
}
// console.log("Final Data")
// console.log(finalData);

// Groups - X Axis - Tweet Segments
var groups = [...new Set(finalData.map(d => d[0]))];
// console.log("groups");
// console.log(groups);
groups.sort((a, b) => a - b)
// console.log("groups");
// console.log(groups);

// Final Data - Data Preprocessing - Used in the Data Viz
var finalDataViz=[];
for (let i=0;i<groups.length;i++)
{
  finalDataViz.push({"date": groups[i], 
              "anger":0,
              "fear":0,
              "anticipation":0,
              "trust":0,
              "suprise":0,  
              "sadness":0,
              "joy":0,
              "disgust":0,
              "totalWords":0,
              "angerWords":[],
              "fearWords":[],
              "anticipationWords":[],
              "trustWords":[],
              "supriseWords":[],  
              "sadnessWords":[],
              "joyWords":[],
              "disgustWords":[],
              "totalWords":[],
          });

};

for(let i=0;i<finalData.length;i++){

  let index = finalDataViz.findIndex(object => {
      return object.date ===  finalData[i][0];
    });
  finalDataViz[index][finalData[i][4]]=finalData[i][1].length;
  finalDataViz[index]["totalWords"]=finalData[i][3]
  let words=finalData[i][4]+"Words";
  finalDataViz[index][words]=finalData[i][1];
  finalDataViz[index]["totalWords"]=finalData[i][3];     
}

// Overall Total Words in all tweet segments considered
let overallTotalWords=0
for(let i=0;i<finalDataViz.length;i++){
  overallTotalWords+= finalDataViz[i]["totalWords"];
};

// console.log("finalDataViz");   
// console.log(finalDataViz);

// Subgroups considering only the column names required
const subgroups = ["anger","fear","anticipation","trust","suprise","sadness","joy","disgust"];


// X Axis
const x = d3.scaleBand()
  .domain(groups)
  .range([0, 1000])
  .padding([0.0])

// svgMarimekkoChart.append("g")
// .attr("transform", `translate(0, ${height})`)
// .call(d3.axisBottom(x));

svgMarimekkoChart.append("text")
.attr("x", widthMarimekkoChart /2 )
.attr("y", heightMarimekkoChart + margin.bottom -16)
.text("Tweet Segments")
.style("font-weight","bold")
.style("font-size","16px")
.style("text-anchor", "middle"); 

// Y Axis

let maxYAxisCount=1;
// let maxYAxisCount=Math.max(...finalData.map(o => o[3]))
// console.log(maxYAxisCount);

var y = d3.scaleLinear().domain([0,maxYAxisCount]).rangeRound([heightMarimekkoChart, 0]);

svgMarimekkoChart.append("g").call(d3.axisLeft(y).tickFormat(d3.format(".0%"))).style("font-weight","bold").style("font-size","14px"); 

svgMarimekkoChart.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y",  -1*margin.left)
  .attr("x",0 - (heightMarimekkoChart / 2))
  .attr("dy", "1em")
  .text("Emotions Contributions % + Words per Emotion")
  .style("font-weight","bold")
  .style("font-size","16px")
  .style("text-anchor", "middle");

// Total Words Heading for each column
svgMarimekkoChart.append("text")
  .attr("x", margin.left+38 )
  .attr("y", -30)
  .text("Total Words per Tweet Segment:")
  .style("font-weight","bold")
  .style("font-size","16px")
  .style("text-anchor", "middle"); 

// Color
const color = d3.scaleOrdinal()
  .domain(["anger","fear","anticipation","trust","suprise","sadness","joy","disgust"])
  .range(['#eb4034','#3bb347','#fa7916','#07f566','#07f5f1','#86b5cf','#f7f707','#8b07f7']);

// StackedData used in the Data Viz
const stackedData = d3.stack()
  .offset(d3.stackOffsetExpand)
  .keys(subgroups)
  (finalDataViz)

// console.log(stackedData)

// Tooltip for data viz 
const tooltipEnhancement = d3.select("body")
  .append("div")
  .attr("class","enhancementTooltip")
  .style("position", "absolute")
  .style("z-index", "10")
  .style("visibility", "hidden")
  .style("border-radius", "6px")
  .style("background", "#FFFF8A")
  .style("color", "black")
  .style("outline", "thin solid black")
  .style("padding", "5px")
  .style("font-style","italic")
  .text("emotion");

let xStoredPositions = [];


let widthStoredPositions = new Array(groups.length);
// Show the bars
let support=true;
let prevI=0;
svgMarimekkoChart.append("g")
  .selectAll("g")
  .data(stackedData)
  .join("g")
  .attr("fill", function(d){ return color(d.key)})
  .attr("class", function(d){ 
      // console.log ("barRect" + d.key); 
      return "barRect " + d.key })
  .selectAll("rect")
  .data(d => d)
  .join("rect")
      // .attr("x", d => x(d.data.date))
      .attr("x", function (d, i) { 
          if(i==0){
              // console.log(xStoredPositions)
              if(i==0 && prevI!=0 && support==true){
                  for(let j=0; j<groups.length; j++){
                      
                      // Tweet Segment name for each bar
                      svgMarimekkoChart.append("text")
                          .data(groups)
                          .text(function (d, i) {
                            if (finalDataViz[j]["totalWords"]==0){
                              return ""
                            } else{
                              let temp= d3.timeFormat("%B %d %Y");
                              return  temp(new Date(groups[j]));
                            }
                          })
                          .attr("x",heightMarimekkoChart+5)
                          .attr("y", function (d) {
                              return -xStoredPositions[j]-(widthStoredPositions[j]/2);
                          })
                          .attr("font-weight", "bold")
                          .style("font-size", "12px")
                          .attr("transform", "rotate(90)");
                          
                      // Total Word Count for each bar
                      svgMarimekkoChart.append("text")
                          .data(groups)
                          .text(function (d, i) {
                              // console.log(finalDataViz[j]["totalWords"])
                              if (finalDataViz[j]["totalWords"]==0){
                                return ""
                              } else{
                              return  finalDataViz[j]["totalWords"];
                              }
                          }) 
                          .attr("y", -5)
                          .attr("x", function (d) {
                              return 0;
                              // return -xStoredPositions[j]-(  widthStoredPositions[j]/2);
                          })
                          .attr("font-weight", "bold")
                          .style("font-size", "12px")
                          .attr("transform", function(d, i){
                              // return `translate(${xStoredPositions[j]+(widthStoredPositions[j]/2)}, 0)rotate(335)`
                              return `translate(${xStoredPositions[j]}, 0)rotate(0)`
                          });       
                  }
                  support = false;
              }
              // Initialize xStoredPosition to zero here
              xStoredPositions=new Array(groups.length).fill(0);
              prevI=i;
              xStoredPositions[0]=0;
              widthStoredPositions[i]=d.data["totalWords"]*widthMarimekkoChart/overallTotalWords;
              return x(d.data.date)    
          }
          widthStoredPositions[i]=d.data["totalWords"]*widthMarimekkoChart/overallTotalWords;
          prevI=i;
          // for loop to add all starting x positions in new array xStoredPositions
          for(let l=0; l<i; l++){
              xStoredPositions[i]=xStoredPositions[i]+widthStoredPositions[l];
          }
          return xStoredPositions[i]
      })
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", function (d, i) { 
          return d.data["totalWords"]*widthMarimekkoChart/overallTotalWords;
      })
      // .attr("width", x.bandwidth())
      // .attr('transform', function (d, i) {
      //     return `translate(${(x.bandwidth()-  d.data["totalWords"]*x.bandwidth()/50  )/2},0)`
      // })
      .attr("stroke","black")
      .on("mouseover", function(d,i) {
          // Tooltip data
          const subgroupName = d3.select(this.parentNode).datum().key;
          // console.log(subgroupName);
          const subgroupValue = i.data[subgroupName];
          let words =subgroupName+"Words";
          // console.log(i.data[words]);
          emotionWords="";
          for(let j=0; j<i.data[words].length;j++){
              emotionWords+=i.data[words][j]+" ";
          }
          tooltipEnhancement.html("<b>"+subgroupName+" ("+subgroupValue+")</b>: "+emotionWords)
              .style("visibility", "visible").style("background", color(subgroupName))

          d3.selectAll(".barRect").style("opacity", 0.2)
          d3.selectAll("."+subgroupName).style("opacity", 1)
          })
      .on("mousemove", function(d,i){
          tooltipEnhancement.style("top", (d.pageY-5)+"px").style("left",(d.pageX+5+"px"));
          })
      .on("mouseout", function(d) {
          tooltipEnhancement.html(``).style("visibility", "hidden");
          d3.selectAll(".barRect").style('opacity', 1);
      });
}

function getSelectedUserTweetData(){
  var u1Data=[];
  selected_user=document.getElementById("user").value;
  const userIndex = users_segments.indexOf(selected_user);
  u1Data = userTweetDataArray[userIndex];
  return u1Data;
}

function loadSegmentTweets(segment_id){
  var segment_data = getSelectedUserTweetData().filter(tweet => tweet.Segment_ID === segment_id.toString());
  segment_tweet_number = segment_data.length;
  var tweet_list = document.getElementById("tweetList");
  tweet_list.innerHTML="";

  word_tweet_mapping = {};
  tweet_word_mapping = {};
  tweet_date_mapping = {};

  for(var i=0; i<segment_data.length; i++){
    var words_vad_emotion = JSON.parse(segment_data[i].Words_VAD_Emotion);
    var words = Object.keys(words_vad_emotion).filter(word => words_vad_emotion[word]['emotion'].toString() != '0,0,0,0,0,0,0,0');
    tweet_date_mapping[i] =  new Date(segment_data[i]["DateTime"])
    var tweet = document.createElement("li");
    tweet.setAttribute("id", "tweet_"+i);
    tweet.setAttribute("onclick","tweetClicked(this)");
    tweet.setAttribute("onmouseover","tweetHover(this)");
    tweet.setAttribute("onmouseleave","tweetLeft(this)");
    tweet.innerHTML = "<a>"+highlightEmotionalWordsInTweet(segment_data[i]['Text'], words)+"</a><p class='tweet_timestamp'>["+tweet_date_mapping[i]+"]</p>";
    tweet_list.appendChild(tweet);

    

    for(var j=0; j<words.length; j++){
      if (word_tweet_mapping.hasOwnProperty(words[j]))
        word_tweet_mapping[words[j]].add(i);
      else{
        word_tweet_mapping[words[j]] = new Set();
        word_tweet_mapping[words[j]].add(i);
      }
      if (tweet_word_mapping.hasOwnProperty(i)){
        tweet_word_mapping[i].add(words[j]);
      }
      else{
        tweet_word_mapping[i] = new Set();
        tweet_word_mapping[i].add(words[j]);
      }
    }
  }

}

function tweetClicked(tweet){
  var tweet = document.getElementById(tweet.id);
  if (selected_tweet === tweet.id){
    tweet.style.outline = 'double';
    selected_tweet = null;
  }
  else {
    if (selected_tweet){
      var previous_selected_tweet = document.getElementById(selected_tweet);
      previous_selected_tweet.style.outline = 'double';
      var previous_selected_words = tweet_word_mapping[selected_tweet.split("_")[1]]
      if (previous_selected_words){
        for (const word of previous_selected_words.values()) {
          d3.selectAll(".pie_"+word)
          .style("stroke-opacity", 0);
        }
      }
  
    }
    tweet.style.outline = 'auto';
    selected_tweet = tweet.id;
  }
  // var tweet_id = tweet.id.split("_")[1];
  // if (tweet_word_mapping.hasOwnProperty(tweet_id)){
  //   var words = tweet_word_mapping[tweet_id];

  // }
}

function tweetHover(tweet){
  // console.log(tweet.id);
  var tweet_id = tweet.id.split("_")[1];
  if (tweet_word_mapping.hasOwnProperty(tweet_id)){
    // console.log(tweet_word_mapping[tweet_id]);
    var words = tweet_word_mapping[tweet_id];
    d3.selectAll(".pie")
      .style("opacity", 0.2);
    for (const word of words.values()) {
      d3.selectAll(".pie_"+word)
      .style("opacity", 0.7)
      .style("stroke-opacity", 0.99);
      
      d3.select(".wordLabel_"+word)
      .style("opacity", 1);
    }
  }
  var tweet_datetime = tweet_date_mapping[tweet_id];
  showTweetOnTimeline(tweet_datetime);
}

function showTweetOnTimeline(datetime){
  svg.select("#tweetCircle").remove();
  svg
    .append('circle')
    .attr('id','tweetCircle')
    .attr('cx', x(datetime))
    .attr('cy', y(0.05))
    .attr('r', 7)
    .attr("stroke", "black")
    .style("stroke-width", "1px")
    .style('fill', 'orange');

}

function tweetLeft(tweet){
  svg.select("#tweetCircle").remove();
  var tweet_id = tweet.id.split("_")[1];
  if (tweet_word_mapping.hasOwnProperty(tweet_id)){
    var words = tweet_word_mapping[tweet_id];
    var selected_words;
    d3.selectAll(".pie")
      .style("opacity", 0.7);
    if (selected_tweet){
      selected_words = tweet_word_mapping[selected_tweet.split("_")[1]]
    }
    for (const word of words.values()) {
      if (!selected_words){
        d3.selectAll(".pie_"+word)
        .style("stroke-opacity", 0);
      }
      else if(!selected_words.has(word)){
        d3.selectAll(".pie_"+word)
        .style("stroke-opacity", 0);
      }

      d3.select(".wordLabel_"+word)
      .style("opacity", 0);
    }
  }
}

function highlightEmotionalWordsInTweet(text,words){
  for(var i=0; i<words.length; i++){
    text = text.replaceAll(words[i], "<b>"+words[i]+"</b>"); 
    var first_upper_case = words[i].charAt(0).toUpperCase() + words[i].slice(1);
    text = text.replaceAll(first_upper_case, "<b>"+first_upper_case+"</b>");
    var all_caps = words[i].toUpperCase();
    text = text.replaceAll(all_caps, "<b>"+all_caps+"</b>");
  }
  return text;
}

function selectTweets(word){
  var tweet_ids = word_tweet_mapping[word]

  var scrolled = false;

  for(var i=0; i<segment_tweet_number; i++){
    var tweet = document.getElementById("tweet_"+i);
    if (tweet_ids.has(i)){
      tweet.style.outline = 'auto';
      if(!scrolled){
        scrollTweetList(i);
        scrolled = true;
      }
        
    }
    else{
      tweet.style.outline = 'double';
    }
  }

}

function deselectTweets(word){
  var tweet_ids = word_tweet_mapping[word]
  for (const id of tweet_ids.values()) {
    var tweet = document.getElementById("tweet_"+id);
    tweet.style.outline = 'double';
  }
}

function scrollTweetList(tweet_id){
  var tweet_container = document.getElementById("tweetContainer");
  var tweet = document.getElementById("tweet_"+tweet_id);
  var topPos = tweet.offsetTop;
  tweet_container.scrollTop = topPos ;
}

function drawScatterplot(segment_id){
  d3.select("#scatterplot_svg").selectAll("*").remove();
  scatterplot_svg = d3.select("#scatterplot_svg")
      .attr("width", scatterplot_width + scatterplot_margin.left + scatterplot_margin.right)
      .attr("height", scatterplot_height + scatterplot_margin.top + scatterplot_margin.bottom)
      .append("g")
      .attr("transform", "translate(" + scatterplot_margin.left + "," + scatterplot_margin.top + ")");

  var scatterplot_data = getSelectedUserTweetData().filter(tweet => tweet.Segment_ID === segment_id.toString());
  // let scatterplot_data = getSelectedUserTweetData();
  
  var scatterplot_pie = d3.pie().value(function(d) {return d[1];});

  pie_data = [];
  for (var i = 0; i < scatterplot_data.length; i++) {
      for (const [key, value] of Object.entries(JSON.parse(scatterplot_data[i].Words_VAD_Emotion))) {
          temp = scatterplot_pie(Object.entries(Object.assign({}, value.emotion)));
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
  var scatterplot_x = d3.scaleLinear()
      .domain([0, 1])
      .range([ 0, scatterplot_width ]);
  
  scatterplot_svg.append("g")
      .attr("transform", "translate(0," + scatterplot_height/2 + ")")
      .call(d3.axisBottom(scatterplot_x));

  // Add Y axis
  var scatterplot_y = d3.scaleLinear()
      .domain([0, 1])
      .range([ scatterplot_height, 0]);
  
  scatterplot_svg.append("g")
      .call(d3.axisLeft(scatterplot_y))
      .attr("transform", "translate(" + scatterplot_width/2 + ", 0)");

  // X axis label:
  scatterplot_svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", scatterplot_width)
      .attr("y", scatterplot_height/2 + scatterplot_margin.top + 20)
      .style("font-size", "12px")
      .text("Arousal");

  // Y axis label:
  scatterplot_svg.append("text")
      .attr("text-anchor", "end")
      .attr("y", scatterplot_margin.top - 5)
      .attr("x", scatterplot_width/2 - 40)
      .style("font-size", "12px")
      .text("Valence")


// Draw data
// const scatterplot_color = d3.scaleOrdinal(d3.schemeSet2); //temp color scale
scatterplot_svg.selectAll('.pie')
  .data(pie_data)
  .join('path')
  // .attr("class", "pie")
  .attr("class", function(d){
    return "pie pie_"+d.key;
  })
  .attr('d', d3.arc()
      .innerRadius(0)
      .outerRadius(function(d) {return Math.max(d.dominance*(Math.min(scatterplot_width, scatterplot_height) / 15 - 10), 6);})
  )
  .attr('fill', function(d) { return color(keys[parseInt(d.data[0])])}) // scatterplot_color(d.data[0]);
  .attr('transform', function(d) { return 'translate(' + scatterplot_x(d.arousal) + ',' + scatterplot_y(d.valence) + ')';})
  .on("click", function(d, i) {
      if (d3.select(this).style("stroke-opacity") < 1) {
        scatterplot_svg.selectAll('.pie').style("stroke-opacity", 0);
        scatterplot_svg.selectAll('.pie').each(function(d) {
              if(d.valence == i.valence && d.arousal == i.arousal) {
                  d3.select(this).style("stroke-opacity", 1);
                  selectTweets(d.key);
              }
          });
      }
      else { 
        scatterplot_svg.selectAll('.pie').style("stroke-opacity", 0);
        deselectTweets(i.key);
      }
  })
  .on("mouseover", function(d, i) {
      if (d3.select(this).style("stroke-opacity") == 0) {
        scatterplot_svg.selectAll('.pie').each(function(d) {
              if(d.valence == i.valence && d.arousal == i.arousal) {
                  d3.select(this).style("stroke-opacity", 0.99);
              }
          });
      }
      var emotionText = "";
      for (var j = 0; j < i.emotion.length; j++) {
          if (i.emotion[j] == 1) {
              emotionText += keys[j] + " ";
          }
      }
      const text = "<i>" + i.key + "</i><br><b>valence</b> " + i.valence + "<br><b>arousal</b> " + i.arousal + "<br><b>dominance</b> " + i.dominance + "<br><b>emotion</b> " + emotionText;
      scatterplot_tooltip.html(text)
          .style('opacity', .9)
          .style('left', (d.pageX+20) + 'px')
          .style('top', (d.pageY+20) + 'px');
      highlightTweets(i.key, true);
  })
  .on("mousemove", function(d) {
    scatterplot_tooltip.style('top', d.pageY+20+'px')
          .style('left',d.pageX+20+'px');
  })
  .on("mouseout", function(d,i) {
      if (d3.select(this).style("stroke-opacity") == 0.99) {
        scatterplot_svg.selectAll('.pie').each(function(d) {
              var selected_words;
              var stay_highlighted = false;
              if (selected_tweet){
                selected_words = tweet_word_mapping[selected_tweet.split("_")[1]]
                if (selected_words && selected_words.has(d.key))
                  stay_highlighted = true;
              }
              if(d.valence == i.valence && d.arousal == i.arousal && !stay_highlighted) {
                  d3.select(this).style("stroke-opacity", 0);
              }
          });
      }
      scatterplot_tooltip.html("")
          .style('opacity', 0)
          .style('left', -scatterplot_margin.left + 'px')
          .style('top', -scatterplot_margin.top + 'px');
      highlightTweets(i.key, false);
  })
  .attr("stroke", "black")
  .style("stroke-width", "2px")
  .style("stroke-opacity", 0)
  .style("opacity", 0.7);

  var wordLabel = scatterplot_svg.selectAll('.wordLabel').data(pie_data);
  wordLabel
    .join("text")
    .attr("class", function(d){
        return "wordLabel wordLabel_"+d.key;
    })
    .attr("x", function(d) { 
        return scatterplot_x(d.arousal)+22*d.dominance; 
    })
    .attr("y", function(d) { 
      return scatterplot_y(d.valence); 
    })
    .attr("transform", "translate(0,2)")
    .attr("text-anchor", "start")
    .style("font-size", "10px")
    .text(function(d){ return d.key })
    .style("opacity", 0);




    
}


function drawStreamGraph(dateRange=null){

  dateRangeGlobal = dateRange;
  
  d3.select("#streamGraph").selectAll("*").remove();
  
  // arrayOfObjects 
  var arrObj = getSelectedUserData();

    const height = 500 - margin.top - margin.bottom;
    const width = 1400- margin.left - margin.right;

    svg = d3.select("#streamGraph")
          .attr("height", height + margin.top + margin.bottom)
          .attr("width", width + margin.left + margin.right)
          .append("g")
          .attr("transform",`translate(${margin.left}, ${margin.top})`);

    var data=arrObj;

    var dateArray = [...new Set(arrObj.map(d => d['date']))];
    var minDate=d3.min(dateArray);
    var maxDate=d3.max(dateArray);
    
    if (dateRange){
      minDate = dateRange[0];
      maxDate = dateRange[1];
    }

    // update dataArray based on max and min dates
    var updatedDateArray=[]
    for (let i = 0; i < dateArray.length; i++) {
      if (dateArray[i]>=minDate && dateArray[i]<=maxDate){
        updatedDateArray.push(dateArray[i])
      };
    };
    var xAxisMinDate=d3.min(updatedDateArray);
    var xAxisMaxDate=d3.max(updatedDateArray);

    // update dataArray based on max and min dates
    var updatedData=[];
    for (let i = 0; i < data.length; i++) {
      if (data[i]["date"]>=minDate && data[i]["date"]<=maxDate){
        updatedData.push(data[i])
      };
    };

    // X axis
    x = d3.scaleTime()
      .domain([xAxisMinDate, xAxisMaxDate])
      // .domain(d3.extent(updatedDateArray, function(d) { return d; }))
      .range([ 0, width ]);


      var tickArray = updatedDateArray.filter(function(v, i) { 
        return i % 3 === 0;
      
      });

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      // .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")).tickValues(tickArray));
      .call(d3.axisBottom(x).ticks(10));
        
        

    // Y axis Streamgraph
    y = d3.scaleLinear().domain([0,1]).range([ height,0]);
    svg.append("g").call(d3.axisLeft(y));

    svg.append("text")
      .attr("text-anchor", "end")
      .attr("y", y(1))
      .attr("x", 50)
      .style("font-size", "12px")
      .text("Valence")

    if (segment_selected){
      drawSegmentRedLine();
    }

    // Y axis Area Chart
    
    console.log(user);
    console.log(getMaxAreaChart(areaChartObject[user]));
    const y_Area = d3.scaleLinear().domain([0, getMaxAreaChart(areaChartObject[user])]).range([ height,0]);
    svg.append("g").attr("class","yAxisArea").attr("transform", "translate(" + width + ", 0)").call(d3.axisRight(y_Area));

    svg.append("text")
      .attr("class","yAxisAreaLabel")
      .attr("text-anchor", "end")
      .attr("y", y(1))
      .attr("x", width-10)
      .style("font-size", "12px")
      .style("opacity", 0)
      .text("Tweets");

    d3.select(".yAxisArea").style("visibility", "hidden");
  
    updatedData.forEach((obj)=>{
      var total = obj.anger + obj.fear + obj.anticipation + obj.trust + obj.suprise + obj.sadness + obj.joy + obj.disgust;
      for (const [key, value] of Object.entries(obj)) {
        if(keys.includes(key)){
          // obj[key] = ((obj[key] * 0.4) / total);
          obj[key] = (obj[key] / total)*streamGraphWidth;
        }
      }
    })
  
    /* Plot the area chart */
    var area1 = d3.area()
      .defined(function(d){ 
        return d.date <= xAxisMaxDate && d.date >= xAxisMinDate ;
       })
      .x(function(d) { return x(d.date); })
      .y0(height)
      .y1(function(d) { return y_Area(d.tweet_count ); });
  
    let areaData = [];
    const userAreaData = areaChartObject[user];
    for(let i = 0 , l = userAreaData.length; i < l-1; i=i+1) {
      let tempArr = [];
      tempArr.push(userAreaData[i]);
      tempArr.push(userAreaData[i+1]);
      areaData.push(tempArr);
    }

    areaData.forEach((ele) => {
      svg.append("path")
      .datum(ele)
      .attr("class", "area")
      .on("mouseover", function(d,i) {
            var tempData = [];
            var obj = {};
            obj['date'] = i[0].date;
            obj['val'] = 0;
            tempData.push(Object.assign({},obj));

            var area_wc_data = [];
            const max_val = Math.max(...i[1].map.values());
            for (const [key, value] of i[1].map) {
              if(max_val >= 35){
                area_wc_data.push({word: key, freq: value * (max_val / 35)});
              }else{
                area_wc_data.push({word: key, freq: value * (35 / max_val)});
              }
            }

            var red_lines = svg.selectAll(".red_line")
              .data(tempData);
              
            red_lines.enter().append('line')
              .attr("class", "red_lines")
              .merge(red_lines)
              .attr("stroke", "red")
              .attr('stroke-width', 0.5)
              .attr("x1", (d) => { return x(d.date); })
              .attr("x2", (d) => { return x(d.date); })
              .attr("y1", y(0))
              .attr("y2", (d) => { y(1); })

              d3.select(this).style('opacity', 1);
              d3.select(".yAxisArea").style("visibility", "visible");
              d3.select(".yAxisAreaLabel").style("opacity", 1);
              divTip_Area.style("opacity", .9);
              divTip_Area.style("left", (d.pageX) + "px").style("top", (d.pageY) + "px");
              wordChart_AreaGraph(area_wc_data);
  
      })
      .on("mouseout", function(d) {
              d3.select(this).style('opacity', 0.5);
              d3.select(".yAxisArea").style("visibility", "hidden");
              d3.select(".yAxisAreaLabel").style("opacity", 0);
              d3.select(".tooltip_area").style('opacity', 0); // Hide tooltip when hovered
              d3.select(".tooltip_area").selectAll("*").remove();
              d3.select(".red_lines").remove();
              d3.selectAll("#word_cloud_chart").remove();
      })
      .on("click", function(d,i) {
        // console.log(i[0].Segment_ID);
        drawScatterplot(i[0].Segment_ID);
        loadSegmentTweets(i[0].Segment_ID);
        segment_selected = i[0].date
        // drawSegmentRedLine();
        drawStreamGraph(dateRange);
      })
      .attr('fill', 'rgba(70, 130, 180)')
      .attr("opacity", 0.5)
      .attr("d", area1);
    });

    // console.log(updatedData);
    

    /* stack Data */
    const stackedData = d3.stack()
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetSilhouette)
      .offset(d3.stackOffsetWiggle)
      .keys(keys)(updatedData);

    test = stackedData;

    var area = d3.area()
      .x(function(d) { return x(d.data.date); })
      .y0(function(d) { 
        // console.log(d);
        // return y(d[0] + 0.2); 
        return y((d[0]+d.data.valence)/2); 
      })
      .y1(function(d) { 
        // return y(d[1] + 0.2); 
        return y((d[1]+d.data.valence)/2); 
      })
      .curve(d3.curveBasis);
        
    const tooltipStreamgraph = d3.select("body")
        .append("div")
        .attr("class","streamGraphTooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("border-radius", "6px")
        .style("background", "#FFFF8A")
        .style("color", "black")
        .style("outline", "thin solid black")
        .style("padding", "5px")
        .style("font-style","italic")
        .text("emotion");

    svg.selectAll("mylayers")
    .data(stackedData)
    .join("path")
    .attr('class',"stack_layers")
    .on("mouseover", function(d,i) {
      tooltipStreamgraph.html(`Data: ${d}`).style("visibility", "visible").text(i.key);
      d3.selectAll(".stack_layers").style('opacity',0.4);
      d3.select(this).style('opacity',1);

    })
    .on("mousemove", function(d,i){
      tooltipStreamgraph.style("top", (d.pageY-5)+"px").style("left",(d.pageX+5+"px"));
    })
    .on("mouseout", function(d) {
      tooltipStreamgraph.html(``).style("visibility", "hidden");
      d3.selectAll(".stack_layers").style('opacity', 0.8);
    })
    .attr("transform", function(d) { return "translate(0," + -90 + ")"; })
    .style("fill", function(d) { return color(d.key); })
    .attr("d", area)
    .attr("opacity", 0.8)
  

    var circles = svg.selectAll("._circle")
                .data(updatedData);

    circles.enter().append('circle')
        .attr('id', function(d){ return 'circle' })
        .attr('class',"cnty_circles")
        .attr('class',function(d){
          return "cnty_circles cnty_circle_"+d.segment_id;
        })
        .merge(circles)
        .attr("cx", (d) => {return x(d.date);})
        .attr("cy", (d) => y(d.valence) )
        .attr("r", 10)
        .on("mouseover", function(d,i) {
          circle_packing(i.date, i.valence, i)   
        })
        .style("stroke", "black")
        .style("stroke-width", 1.5)
        .attr("fill", "grey")
    
    // var rext = svg.selectAll(".rect").append("re").data(updatedData);

    // // Add the path using this helper function
    // rext.enter().append('rect')
    //     .attr('id', function(d){ ; return 'rectangle' })
    //     .attr('class',"cnty_rects")
    //     .merge(rext)
    //     .attr("transform", "translate(" + (-9) + ", 0)")
    //     .attr("x", (d) => {return x(d.date);})
    //     .attr("y", (d) => y(d.valence) )
    //     .attr('stroke', 'white')
    //     .attr('fill', 'white')
    //     .attr('marker-end','url(#arrow)')
    //     .attr('width', 18)
    //     .attr('height', 1)

    svg.append("svg:defs").append("svg:marker")
    .attr("id", "triangle")
    .attr("refX", 10)
    .attr("refY", 5)
    .attr("markerWidth", 3)
    .attr("markerHeight", 3)
    .attr("viewBox","0 0 10 10")
    .attr("orient", "auto-start-reverse")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z")
    .style("fill", "white");

    var dom_arrows = svg.selectAll(".dom_arrow")
                .data(updatedData);
    dom_arrows.enter()
        .append('line')
        .style("stroke", "white")  
        .attr("class","dom_arrow")
        .attr('stroke-width', 3)
        .attr("x1", function(d){
          return x(d.date);
        })  
        .attr("y1", function(d){
          return y(d.valence)+10;
        })
        .attr("x2", function(d){
          return x(d.date);
        })  
        // .attr("x2", x(segment_selected))     
        // .attr("y2", y(d.valence))
        .attr("y2", function(d){
          return y(d.valence)-10;
        })
        .attr("marker-start", "url(#triangle)") 
        .attr("transform", function(d){
            var angle = d.dominance*(-180);
            return "rotate("+angle+" "+x(d.date)+" "+y(d.valence)+")";
        });
        // .attr("transform","rotate(45 100 100)");
    
      // draw horizontal line showing 0.5 valence
      svg.append("line")          
        .style("stroke", "black")  
        // .attr("class","segment_red_line")
        .attr('stroke-width', 1)
        .attr("x1", x(xAxisMinDate))  
        .attr("y1", y(0.5))  
        .attr("x2", x(xAxisMaxDate))     
        .attr("y2", y(0.5));

    /** Draw aggregated pie chart after Stream Graph creation */
    aggregatedPieChart();

};

function drawSegmentRedLine(){
  d3.selectAll(".segment_red_line").remove();

  if (!dateRangeGlobal){
    svg.append("line")          
    .style("stroke", "red")  
    .attr("class","segment_red_line")
    .attr('stroke-width', 1.5)
    .attr("x1", x(segment_selected))  
    .attr("y1", y(0))  
    .attr("x2", x(segment_selected))     
    .attr("y2", y(1));

  }
  else if (dateRangeGlobal[0] <= segment_selected && dateRangeGlobal[1] >= segment_selected){
    svg.append("line")          
    .style("stroke", "red")  
    .attr("class","segment_red_line")
    .attr('stroke-width', 1.5)
    .attr("x1", x(segment_selected))  
    .attr("y1", y(0))  
    .attr("x2", x(segment_selected))     
    .attr("y2", y(1));

  }

  
  svg_ChartA.append("line")          
    .style("stroke", "red")  
    .attr("class","segment_red_line")
    .attr('stroke-width', 1.5)
    .attr("x1", xScale_ChartA(segment_selected))  
    .attr("y1", yScale_ChartA(0))  
    .attr("x2", xScale_ChartA(segment_selected))     
    .attr("y2", yScale_ChartA(0.95))
    .attr("marker-end", "url(#arrow)");
}

function highlightTweets(word, highlight){
  tweet_ids = word_tweet_mapping[word]
  for (const id of tweet_ids) {
    var tweet = document.getElementById("tweet_"+id);
    if (highlight)
      // tweet.setAttribute("style", "background-color: orange");
      tweet.style.backgroundColor = "orange";
    else
      // tweet.setAttribute("style", "background-color: white");
      tweet.style.backgroundColor = "white";

  }
}

// function drawLineChart(dateArray, userData, dataSetName){
function drawLineChart(){
  var userData = getSelectedUserData();
  var dateArray = [...new Set(userData.map(d => d['date']))];
  var dataSetName = user;

  lineChartDateArray= dateArray;

  d3.select("#lineGraph").selectAll("*").remove();
  const l_height = 100 - margin.bottom;
  const l_width = 1400 - margin.left - margin.right;

  /* SVG Element for the line graph */
  svg_ChartA = d3.select("#lineGraph")
                .attr("height", l_height)
                .attr("width", l_width + margin.left + margin.right)
                .append("g")
                .attr("transform",`translate(${margin.left}, ${margin.top})`);

  xScale_ChartA = d3.scaleTime().domain([d3.min(dateArray), d3.max(dateArray)]).range([0, l_width]);
  //var tickArray = dateArray.filter(function(v, i) { return i % 3 === 0; });

  svg_ChartA.append("g").attr("transform", `translate(0, ${l_height - margin.top * 2})`)
      // .call(d3.axisBottom(xScale_ChartA).tickFormat(d3.timeFormat("%Y-%m-%d")).tickValues(dateArray).ticks(10));
      .call(d3.axisBottom(xScale_ChartA).ticks(10));
      
  yScale_ChartA = d3.scaleLinear().domain([0,1]).range([(l_height - margin.top * 2), 0]);
  svg_ChartA.append("g").attr("class","yAxis_LineChart").call(d3.axisLeft(yScale_ChartA));
  d3.select(".yAxis_LineChart").style("visibility", "hidden");

  /* Add line into SVG */
  var line = d3.line()
              .x(function(d) { return xScale_ChartA(d.date);})
              .y(function(d) { return yScale_ChartA(d.valence);})

  var dataArr = [["key", userData]];

  svg_ChartA.selectAll(".line")
      .data(dataArr)
      .join("path")
      .attr('class',"lines")
      .attr("fill", "none")
      .attr("stroke-dashoffset", 600)
      .attr('opacity', 1)
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("d", d => { return line(d[1])});
  
  var pcircles = svg_ChartA.selectAll(".pos_circles")
      .data(userData)
      
  pcircles.enter().append('circle')
      .attr("class", "circles")
      .merge(pcircles)
      .attr("cx", (d) => { return xScale_ChartA(d.date); })
      .attr("cy", (d) => { return yScale_ChartA(d.valence); })
      .attr("r", 3)
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("fill", "white");

  const y_Area = d3.scaleLinear().domain([0, getMaxAreaChart(areaChartObject[dataSetName])]).range([(l_height - margin.top * 2), 0]);
  svg_ChartA.append("g").attr("class","yAxis_LineArea").attr("transform", "translate(" + l_width + ", 0)").call(d3.axisRight(y_Area));
  d3.select(".yAxis_LineArea").style("visibility", "hidden");

  /* Plot the area chart */
  var area = d3.area()
    .x(function(d) { return xScale_ChartA(d.date); })
    .y0(l_height - margin.top * 2)
    .y1(function(d) { return y_Area(d.tweet_count ); });

  svg_ChartA.append("path")
    .datum(areaChartObject[dataSetName])
    .attr("class", "area")
    .attr('fill', 'rgba(70, 130, 180)')
    .attr("opacity", 0.5)
    .attr("d", area);

  svg_ChartA.call( d3.brushX()                 
    .extent( [ [0,0], [l_width, l_height] ] ) 
    .on("start brush", brushChanged) 
  );

}

function getMaxAreaChart(arrayData){
  let max_y = 0;

  for(let i = 0; i < arrayData.length; i++){
    if(arrayData[i].tweet_count > max_y){
      max_y = arrayData[i].tweet_count;
    }
  }

  return max_y + 10;
}

function brushChanged(event){
  extent = event.selection;
  var startDate;
  var endDate;
  for(var i=0; i<lineChartDateArray.length; i++){
    if(xScale_ChartA(lineChartDateArray[i])>=extent[0]){
      startDate = lineChartDateArray[i]
      break;
    }
  }
  for(var i=lineChartDateArray.length-1; i>=0; i--){
    if(xScale_ChartA(lineChartDateArray[i])<=extent[1]){
      endDate = lineChartDateArray[i]
      break;
    }
  
  }
  // console.log([startDate, endDate]);
  drawStreamGraph([startDate, endDate]);
}

function circle_packing(date, valence, data_packing){

  /** 
     * Plot of the packing circles 
     * 
     */

  var dataset = {className: "root", children :[]};

  var circle_packing_data = data_packing.circle_packing_data;
  // console.log(data_packing);
  var segment_id = data_packing.segment_id;
  var segment_date = data_packing.date;
  for(let d = 0; d < circle_packing_data.length; d++){
    let obj = circle_packing_data[d];
    // if(obj.arousal > 0.5){
      obj.valence = parseFloat(obj.valence).toFixed(2);
      obj.dominance = parseFloat(obj.dominance).toFixed(2);
      obj.arousal = parseFloat(obj.arousal).toFixed(2);
      obj["emotion"] = keys[d];
      obj["value"] = (data_packing[keys[d]]/streamGraphWidth).toFixed(2);
      dataset.children.push(obj);
    // }
  }

  divTip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("border", "1px solid white")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("opacity", 0);

  var r = 80;
  const pack = d3.pack().size([r, r]);
  
  container = svg.append("svg:svg")
      .attr("width", r)
      .attr("height", r)
      .attr("x", x(date) - 40)
      .attr("y", y(valence) - 40)
      .on("mouseleave", function(d,i) {
          d3.select(".container_svg").remove();
      })
      .attr("class", "container_svg");
    
  const nodes = d3.hierarchy(dataset)
      .sum(function(d) { return d.value; });
  
  var node = container.selectAll("g.node")
      .data(pack(nodes))
      .enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
  });
    
  node.append("svg:circle")
      .attr("r", function (d) {
      return d.r;
  })
  .style("fill", function (d) {
      return d.children ? 'white' : color(d.data.emotion);
  })
  .on("mouseover", function(d,i) {
    if(!i.children){
      divTip.style("opacity", .9);
      divTip.html(i.data.emotion + "<br><b>Valence: </b>" + i.data.valence + "<br><b>Arousal: </b>" + i.data.arousal 
      + "<br><b>Dominance: </b>" + i.data.dominance + "<br><b>Strength: </b>" + Math.round(i.data.value*100) +"%")
      .style("left", (d.pageX) + "px").style("top", (d.pageY) + "px");
              
    }
  })
  .on("mouseleave", function(d,i) {
    divTip.style("opacity", 0);
  })
  .on("click", function(d,i) {
    drawScatterplot(segment_id);
    loadSegmentTweets(segment_id);
    segment_selected = segment_date;
  })
  .style("fill-opacity", function (d) {
      return d.children ? 0.4 : 1;
  })
  .style("stroke", "black")
  .style("stroke-width", 1.5)

  // node.append("svg:rect")
  //     .attr("width", function (d) {
  //       return d.r * 2;
  //   })
  //   .attr("height", 2)
  //   .style("fill", "white")
  //   .attr("transform", function (d) {
  //     return "translate(" + -d.r + "," + 0 + ")";
  //   })
  //   .style("fill-opacity", function (d) {
  //     return d.children ? 0 : 1;
  // })
  node.append("svg:defs").append("svg:marker")
    .attr("id", "triangle")
    .attr("refX", 10)
    .attr("refY", 0)
    .attr("markerWidth", 4)
    .attr("markerHeight", 4)
    .attr("viewBox","0 0 10 10")
    .attr("orient", "auto-start-reverse")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z")
    .style("fill", "white");
  node.append("svg:line")
        .style("stroke", "white")  
        .attr("class","dom_arrow")
        .attr('stroke-width', 2)
        .style("stroke-opacity", function (d) {
              return d.children ? 0 : 1;
        })
        .attr('x1',0)
        .attr('y1',function(d){
          return -d.r;
        })
        .attr('x2',0)
        .attr('y2',function(d){
          return d.r;
        })
        .attr("marker-end", function(d){
          return d.children ? "" : "url(#triangle)";
        })
        .attr("transform", function(d){
          var angle = d.children ? 0 : d.data.dominance*(-180);
          return "rotate("+angle+" 0 0)";
      });
}

function wordChart_AreaGraph(myWords){

    var cwidth = 240, cheight = 240;

    d3.select(".tooltip_area").append("svg")
            .attr("id", "area_wc_svg")
            .attr("width", 240)
            .attr("height", 240);

    /* Pie chart word cloud*/
    d3.layout.cloud()
        .size([cwidth, cheight])
        .words(myWords)
        .rotate(function() {
          return ~~(Math.random() * 2) * 90;
        })
        .font("Impact")
        .fontSize(function(d) {
          return d.freq;
        })
        .on("end", drawAreaWordCloud)
        .start();

    function drawAreaWordCloud(words) {
        d3.select("#area_wc_svg")
        .attr("width", cwidth)
        .attr("height", cheight)
        .append("g")
        .attr("transform", "translate(" + ~~(cwidth / 2) + "," + ~~(cheight / 2) + ")")
        .selectAll("text")
        .data(words)
        .enter().append("text")
        .attr("class", "area_word_chart_text")
        .style("font-size", function(d) {
          return d.freq + "px";
        })
        .style("-webkit-touch-callout", "none")
        .style("-webkit-user-select", "none")
        .style("-khtml-user-select", "none")
        .style("-moz-user-select", "none")
        .style("-ms-user-select", "none")
        .style("user-select", "none")
        .style("cursor", "default")
        .style("font-family", "Impact")
        .style("fill", "black")
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) {
          return d.word;
        });
    }
}


function aggregatedPieChart(){
  console.log("in area chart");
    d3.select("#pie_svg").selectAll("*").remove();
    d3.select("#pie_word_cloud").selectAll("*").remove();
    const pie_width = 600, pie_height = 500, pie_margin = 30;
    const radius = Math.min(pie_width, pie_height) / 2 - pie_margin

    var data = {};
    console.log(data);
    for (const [key, value] of pieChartData[user]) {
      data[key] = value.size;
    }

    var wordChartData = [];
    let max = Math.max(...pieChartData[user].get("trust").values());
    for (const [key, value] of pieChartData[user].get("trust")) {
      if(max >= 60){
        wordChartData.push({text: key, size: value * (max / 60)});
      }else{
        wordChartData.push({text: key, size: value * (60 / max)});
      }
    }


    var pie_divTip = d3.select("body").append("div")
            .attr("class", "pie_tooltip")
            .style("border", "1px solid white")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("opacity", 0);

    // set the color scale
    var pie_arc = d3.arc().innerRadius(0).outerRadius(radius - 10)

    var pie_svg = d3.select("#pie_svg")
      .attr("width", pie_width)
      .attr("height", pie_height)
      .append("g")
      .attr('class', 'donut-container')
      .attr("transform", "translate(" + pie_width / 2 + "," + pie_height / 2 + ")");

    var pie = d3.pie().value(function(d) {return d[1]; });
    var data_ready = pie(Object.entries(data))

    /* Build the pie chart */
    pie_svg.selectAll('arc')
      .data(data_ready)
      .enter().append('path')
      .attr('class','arc')
      .attr('d', pie_arc)
      .on("mouseover", function(d,i) {

          pie_divTip.style("opacity", .9);
          pie_divTip.html(i.data[0]).style("left", (d.pageX) + "px").style("top", (d.pageY) + "px");
          
          /* Update wordchart on hover of the pie chart */
          wordChartData = [];
          console.log(i);
          d3.selectAll(".pie_word_chart_text").remove();
          max = Math.max(...pieChartData[user].get(i.data[0]).values());
          for (const [key, value] of pieChartData[user].get(i.data[0])) {
            if(max >= 40){
              wordChartData.push({text: key, size: value * (max / 60)}); // Size on a scale of 40
            }else{
              wordChartData.push({text: key, size: value * (60 / max)}); // Size on a scale of 40
            }
          }
          pieChartWordChart(i.data[0], pie_width, pie_height, wordChartData);
      })
      .on("mouseleave", function(d,i) {
          pie_divTip.style("opacity", 0);
      })
      .attr('fill', function(d){
          return color(d.data[0]);
      })
      .attr("stroke", "black")
      .style("stroke-width", "2px")
      .style("opacity", 0.7);

    const labelArc = d3.arc()
        .outerRadius(radius - 45)
        .innerRadius(radius - 45);

      //Create an SVG text element and append a textPath element
      pie_svg.selectAll('arc_txt')
        .data(data_ready)
        .enter().append('text')
        .attr('class','arc_txt')
        .attr('transform', (d) => { return 'translate(' + labelArc.centroid(d) + ')' })
        .attr('dy', '.35em')
        .style("text-anchor","middle") //place the text halfway on the arc
        .style("font-weight", 750)
        .attr("startOffset", "50%")
        .text((d) => {
          console.log(d);
          return parseFloat(57.2958 * (d.endAngle - d.startAngle)*100/360).toFixed(2) + "%";
        });

      pieChartWordChart(null, pie_width, pie_height, wordChartData);
}


function pieChartWordChart(emotion, pie_width, pie_height, wordChartData){
  d3.select("#word_cloud_label").remove();
  d3.select("#pie_word_cloud")
    .append("text")
    .attr("id", "word_cloud_label")
    .attr("text-anchor", "middle")
    .attr("x", pie_width/2)
    .attr("y", 20)
    .style("font-size", "15px")
    .text(function(){
      if (emotion)
        return "Emotion: "+emotion;
      else
        return ""
    });
  /* Pie chart word cloud*/
    d3.layout.cloud()
        .size([pie_width, pie_height])
        .words(wordChartData)
        .rotate(function() {
          return ~~(Math.random() * 2) * 90;
        })
        .font("Impact")
        .fontSize(function(d) {
          return d.size;
        })
        .on("end", drawWordCloud)
        .start();

    function drawWordCloud(words) {
        d3.select("#pie_word_cloud")
        .attr("width", pie_width)
        .attr("height", pie_height)
        .append("g")
        .attr("transform", "translate(" + ~~(pie_width / 2) + "," + ~~(pie_height / 2) + ")")
        .selectAll("text")
        .data(words)
        .enter().append("text")
        .attr("class", "pie_word_chart_text")
        .style("font-size", function(d) {
          return d.size + "px";
        })
        .style("-webkit-touch-callout", "none")
        .style("-webkit-user-select", "none")
        .style("-khtml-user-select", "none")
        .style("-moz-user-select", "none")
        .style("-ms-user-select", "none")
        .style("user-select", "none")
        .style("cursor", "default")
        .style("font-family", "Impact")
        .style("fill", "black")
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) {
          return d.text;
        });
    }
}