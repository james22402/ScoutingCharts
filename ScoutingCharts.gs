function getSheet() {
  var sheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1cDJ7KMD6cKxlCnkR5bUXbs5ozasW3Vf4O1kQzBs18S0/edit');
  return sheet;
}

function doLog(l) {
  Logger.log(l);
}

function getDictionary() {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var masterDict = new Array;
  var teamList = new Array;     // We will return this.
  var teamsFound = new Array;   // To keep track of which teams we've seen.
  var numTeams = 0;
  for(var i = 1; i < data.length; i++) // row 0 has the headers
  {
    var teamNum = data[i][1];
    if (teamsFound[teamNum] == null)
    {
      teamsFound[teamNum] = teamNum;
      teamList[numTeams] = teamNum;
      numTeams++;
    }
    
    var DEFENSE_LIST = new Array("Portcullis","Chival De Frise","Ramparts","Moat","Drawbridge","Sally Port","Rock Wall","Rough Terrain","LOWBAR");
    for(var j = 0; j < DEFENSE_LIST.length; j++) {
      var key = teamNum + DEFENSE_LIST[j];
      
      var score = 0;
      if (data[i][j+4] != null)
      {
        if(masterDict[key] != null) {
          score = masterDict[key];
        }
        var curNumTimesCrossed = data[i][j+4];
        if (curNumTimesCrossed > 2)
          curNumTimesCrossed = 2;
        score = score + curNumTimesCrossed;
        doLog("Team Score for " + key + ": " + score)
        masterDict[key] = score;
      }

      doLog("Team #: " + data[i][1]);
      doLog("Range " + sheet.getDataRange().getA1Notation());
      doLog("MasterDict at Team " + key + ": " + masterDict[key]);
      doLog(masterDict[key]);
    }

    // Number of matches
    //
    var count = 0;
    var key = teamNum + "Matches";
    if (masterDict[key] != null) {
      count = masterDict[key];
    }
    masterDict[key] = count + 1;
    doLog("Count for team " + teamNum + " is " + masterDict[key]);
  }
  
  masterDict["Teams"] = teamList;
  doLog("Team list: " + teamList);
  
  return masterDict;
}

function getTeams(d)   // d = master dictionary
{
  var uTeams = d["Teams"];
  if (uTeams == null)
    uTeams = new Array();
  
//  var sheet = getSheet();
//  var data = sheet.getDataRange().getValues();
//  var uTeams = new Array();
//  var numTeams = 0;
//  for(var i = 1; i <data.length; i++)
//  {
//    var teamNum = data[i][1];
//    if(uTeams.indexOf(teamNum) == -1){
//      uTeams[numTeams] = teamNum;
//      numTeams++;
//    }
//  }

  return uTeams;
}

function doGet(e)
{
  Logger.clear();
  doLog("Starting doGet()");
  var ss = getSheet();
  var masterDict = getDictionary();
  var teams = getTeams(masterDict);
  var s2 = ss.getSheets()[1];
  var s2 = s2.activate();
  var cnt = 1;
  var DEFENSE_LIST = new Array("Portcullis","Chival De Frise","Ramparts","Moat","Drawbridge","Sally Port","Rock Wall","Rough Terrain","LOWBAR");
  var page = SitesApp.getPageByUrl("https://sites.google.com/site/paragonscouting/home");
  doLog("Starting doGet() team loop");
  var teamChanged = new Array();
  for(var i = 0; i < teams.length; i++) {
    var team = teams[i];
    var changed = 0;

    // If the number of matches changed, we will need to
    // recreate the data for the team.
    //
    var nkey = team + "Matches";
    var numTimes = masterDict[nkey];

    var data_read_k = s2.getRange(cnt, 1, 1, 1).getValue();
    var data_read_t = s2.getRange(cnt, 2, 1, 1).getValue();
    if (data_read_k == 0)
      changed = 1;
    else if (data_read_t != numTimes)
      changed = 1;
    var data_write = s2.getRange(cnt, 1, 1, 1).setValue(nkey);
    var data_write = s2.getRange(cnt, 2, 1, 1).setValue(numTimes);
    cnt++;

    for (var row=0; row < DEFENSE_LIST.length; row++) {
      var key = team + DEFENSE_LIST[row];
      var avg = masterDict[key]/numTimes; // getNumTimes(team);
      var data_write = s2.getRange(cnt, 1, 1, 1).setValue(key);
      var data_write = s2.getRange(cnt, 2, 1, 1).setValue(avg);
      cnt++;
    }
    
    teamChanged[team] = changed;
    
    doLog("End of doGet() team loop for " + team + ". Changed = " + changed);
  }
  masterDict["TeamChanged"] = teamChanged;
  
  createCharts(masterDict);
}

//function getNumTimes(teamNumber)
//{
//  var ss = getSheet();
//  var sheet = ss.getSheets()[0];
//  var numTimes = 0;
//  var sheetData = sheet.getDataRange().getValues();
//  for(var j = 1; j < sheetData.length; j++) {
//        if(sheetData[j].indexOf(teamNumber) != -1) {
//          numTimes++;
//          //doLog(numTimes + " index Of :: " + sheetData[j].indexOf(teamNumber));
//        }
//      }
//  return numTimes;
//}

function removeCharts(c)
{
  var page = SitesApp.getPageByUrl("https://sites.google.com/site/paragonscouting/home");
  var v =page.getAttachments();
  doLog("Number of existing charts = " + v.length);
  for(var i = 0; i < v.length; i++)
  {
    if(v[i].getBlob().getName() == c)
    {
      Logger.log("Before Delete Chart");
      v[i].deleteAttachment();
      Logger.log("After delete chart");
      break;
    }
    else {
      Logger.log("Chart was not deleted! v[i].blob:: " + v[i].getBlob().getName() + "   c.blob():: " + c);
    }
    
  }
  Logger.log("No chart present");
 }
  

function createCharts(d)
{
  doLog("Start of createCharts()");
  
  doLog("=> After removeCharts()");
  var sheet = getSheet();       //Get the data Value Sheet
  var s2 = sheet.getSheets()[1]; //Get sheet #2 with all the important values on it
  var s2 = s2.activate(); //activate this sheet and make it the current sheet
  var teams = getTeams(d); //get an array of all the unique team numbers
  var teamChanged = d["TeamChanged"]; //See if any teams have had their values changed
  var page = SitesApp.getPageByUrl("https://sites.google.com/site/paragonscouting/home"); //get where we want to upload the graphs to
  var sheetLength = 2; //Initial sheet length/sheet location
  var DEFENSE_LIST = new Array("Portcullis","Chival De Frise","Ramparts","Moat","Drawbridge","Sally Port","Rock Wall","Rough Terrain","LOWBAR");
  doLog("=> Before rendering loop");
  for(var cnt = 0; cnt < teams.length; cnt++) {
    var title = teams[cnt];   // Team
    var changed = teamChanged[title]; //Have they changed?
    var force = -50;
    if (changed != 0 || force >= 0) //If yes, proceed, otherwise, break;
    {
      var a = "A" + sheetLength; //get the 'A' column location; ex. A2
      var adjSheetLength = sheetLength + 8; //Set the lower bound of the sheet length, ex. A8
      var b2 = "B" + adjSheetLength; //get the next column over and lower
      var combo = a + ":" + b2; //make it a range 
      var title = teams[cnt]; 
      
      doLog("  => Before chart");
      var chart = s2.newChart() //Create the acutal chart with the following options:
                  .setChartType(Charts.ChartType.BAR) //BAR chart
                  .addRange(s2.getRange(combo)) //Range we set before
                  .setOption('title', title) //Title it as the 'title' variable
                  .asBarChart() //get it as an EmbededBarChart, not as an EmbededChart
                  .setXAxisTitle("Average Times Crossed") 
                  .setYAxisTitle("Defenses")
                  .build(); //Build the chart when our options have been set
      doLog("  => After chart");
      
      var blobChart = chart.getBlob().setName(title); //Blobs are a way to upload it to the website
      var blobName = blobChart.getName();
      doLog("  => After blob");
      removeCharts(blobName); //Remove the current chart on the website if there is one
      try{
        //Try to add the new chart
        page.addHostedAttachment(blobChart);
        doLog("  => After post");
      }
      catch(exception) {
        doLog("Same Chart!");
      }
    }
    sheetLength = sheetLength + 10; //Set the sheetlength far enough down for the next interval
    doLog("=> At end of rendering loop " + cnt);
    
    if (cnt >= force && force >= 0) //If nothing changed and we aren't forcing it, break; the operation.
      break;
  }
}

function delete230()
{
  var page = SitesApp.getPageByUrl("https://sites.google.com/site/paragonscouting/home");
  var v =page.getAttachments();
  for(var i = 0; i < v.length; i++)
  {
    if(v[i].getBlob().getName() == "230")
    {
      doLog("");
      v[i].deleteAttachment();
      break;
    }
  }
}
