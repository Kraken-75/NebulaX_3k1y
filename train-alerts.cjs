const fs = require('fs');
const path = require('path');
const https = require('follow-redirects').https;

const outputFile = path.join(__dirname, 'public', 'train-alerts.json');
//IMPORTANT READ ME PLS!!!!!!!!
const accountKey = 'YOUR_LTA_ACCOUNT_KEY'; // Replace with your actual LTA DataMall account key

function writeAlertsFile(payload) {
  const alerts = Array.isArray(payload?.value?.Message)
    ? payload.value.Message.map((message, index) => ({
        id: `${message.CreatedDate || 'alert'}-${index}`,
        content: message.Content || 'Train service alert',
        timestamp: message.CreatedDate || null,
      }))
    : [];

  const json = JSON.stringify(
    {
      alerts,
      source: 'TrainServiceAlerts',
      fetchedAt: new Date().toISOString(),
    },
    null,
    2,
  );

  fs.writeFileSync(outputFile, json, 'utf8');
  console.log(`Updated ${outputFile}`);
}

function fetchTrainAlerts() {
  const options = {
    method: 'GET',
    hostname: 'datamall2.mytransport.sg',
    path: '/ltaodataservice/TrainServiceAlerts',
    headers: {
      AccountKey: accountKey,
      Accept: 'application/json',
    },
    maxRedirects: 20,
  };

  const req = https.request(options, function (res) {
    const chunks = [];

    res.on('data', function (chunk) {
      chunks.push(chunk);
    });

    res.on('end', function () {
      const body = Buffer.concat(chunks).toString();

      try {
        const data = JSON.parse(body);
        writeAlertsFile(data);
      } catch (error) {
        console.error('Failed to parse DataMall response:', error);
        console.log(body);
      }
    });
  });

  req.on('error', function (error) {
    console.error(error);
  });

  req.end();
}

fetchTrainAlerts();
setInterval(fetchTrainAlerts, 60000);
