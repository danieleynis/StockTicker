/*
Author: Daniel Eynis
*/

var express = require('express');
var request = require('request');
var moment = require('moment');
var server = express();
var config = require('./config.js');

var stockChartData = {};

server.get('/', (req, res) => { //serve html file to user
	res.sendFile(__dirname + '/ticker.html');
});


server.get('/search', (req, res) => { //when data is requested by client
	var query = req.query.stock; //get query info
	var chart = req.query.chart;

	if(query !== undefined && typeof(query) === 'object' && chart === 'false'){ //this is for batch current stock prices
		var stocks = query.join(',');
		var url = 'https://www.google.com/finance/info?q=' + stocks; //get data from google

		request.get(url, (err, response, body) => {
			if(!err && response.statusCode === 200){
				var data = JSON.parse(JSON.stringify(body));
				data = data.replace(/\//ig, '');
				res.send(data);
			}
			else{
				res.send('no_data');
			}
		});
	}
	else if(query !== undefined && typeof(query) === 'object' && chart === 'true'){ //get historical chart data
		var curTime = new Date();
		var curDate = moment(curTime).format('YYYY-MM-DD');
		var yrAgo = moment(curTime).subtract(1, 'years').format('YYYY-MM-DD');  //get date 1 year ago from now

		if(stockChartData[query[0]] === undefined){
			var url = 'https://www.quandl.com/api/v3/datasets/WIKI/' + query[0] + '.json?column_index=0&column_index=4&api_key=' + config['api_key']
							+ '&start_date=' + yrAgo + '&end_date=' + curDate; //get info from quandle

			request.get(url, (err, response, body) => { //make the request
				if(!err && response.statusCode === 200){
					var data = JSON.parse(body);
					var stockdata = data.dataset.data.reverse(); //reverse data

					for(var i = 0; i < stockdata.length; ++i){ //change dates to epoch
						var temp = moment(stockdata[i][0], "YYYY-MM-DD").valueOf();
						stockdata[i].splice(0, 1);
						stockdata[i].unshift(temp);
					}
					stockChartData[query[0]] = stockdata;  //save data so wont have to pull and modify again
					res.send(stockdata);
				}
				else{
					res.send('no_data');
				}
			});
		}
		else{
			res.send(stockChartData[query[0]]);
		}
	}
	else{
		res.send('no_data');
	}
});

server.listen(8080);
