const express = require('express');
const fs = require('fs');
const router = express.Router();
const auth = require('../../middleware/auth');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const convert = require('xml-js');
const { check, validationResult } = require('express-validator');
const requestbin = require('requestbin');

const Transcript = require('../../models/Transcript');

//credentials
const config = require('config');
const username = config.get('TVEyesUsername');
const password = config.get('TVEyesPassword');
const feedPartnerId = config.get('FeedPartnerId');

//@route POST api/transcripts
//@descript Post individual transcript
//@access Private

router.post(
  '/',
  [
    auth,
    [
      check('programName', 'Program name is required')
        .not()
        .isEmpty(),
      check('date', 'Date is required')
        .not()
        .isEmpty(),
      check('city', 'City is required')
        .not()
        .isEmpty(),
      check('station', 'Station is required')
        .not()
        .isEmpty(),
      check('fullText', 'Full text is required')
        .not()
        .isEmpty(),
      check('viewership', 'Viewership is required')
        .not()
        .isEmpty(),
      check('totalViewership', 'Total viewership is required')
        .not()
        .isEmpty(),
      check('videoLink', 'Video Link is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      programName,
      date,
      state,
      city,
      station,
      fullText,
      videoLink,
      viewership,
      totalViewership
    } = req.body;

    const transcriptFields = {};

    if (programName) transcriptFields.programName = programName;
    if (date) transcriptFields.date = date;
    if (city) transcriptFields.city = city;
    if (state) transcriptFields.state = state;
    if (station) transcriptFields.station = station;
    if (fullText) transcriptFields.fullText = fullText;
    if (videoLink) transcriptFields.videoLink = videoLink;
    if (viewership) transcriptFields.viewership = viewership;
    if (totalViewership) transcriptFields.totalViewership = totalViewership;

    try {
      transcript = new Transcript(transcriptFields);
      await transcript.save();
      res.json(transcript);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);
//@route GET api/transcripts/:transcript_id
//@descript Get transcript by transcript id
//@access Public

router.get('/:transcript_id', async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.transcript_id);

    if (!transcript) {
      return res.status(400).json({ msg: 'Transcript not found' });
    }
    res.json(transcript);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Transcript not found' });
    }
    res.status(500).send('Server Error');
  }
});

//@route GET api/transcripts
//@descript Get all transcripts
//@access Public

router.get('/', async (req, res) => {
  try {
    const transcripts = await Transcript.find().populate();
    res.json(transcripts);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Transcript not found' });
    }
    res.status(500).send('Server Error');
  }
});

//@route POST api/transcripts/:query_string
//@descript Test
//@access Public
router.post('/query/:query_string', async (req, res) => {
  var xhr = new XMLHttpRequest();
  var PORT = process.env.PORT || 5000;
  xhr.open(
    'POST',
    'http://mmsapi.tveyes.com/SavedSearch/savedsearchproxy.aspx?partnerID=20581&Action=add&searchquery=' +
      req.params.query_string +
      '&destination=https://calm-atoll-70051.herokuapp.com/api/transcripts/receiver',
    true
  );

  xhr.onload = function() {
    if (this.status == 200) {
      var SSXML = this.responseText;
      var SSJSON = convert.xml2json(SSXML, { compact: true, spaces: 4 });
      SSJSON = JSON.parse(SSJSON).SavedSearchAPI;
      res.json(SSJSON);
    }
  };
  xhr.send();
});

//@router  api/transcripts/reciever
//@descript reciever data and put into db once query has been searched
//@access Public

function XML2JSON(text) {}

router.post('/receiver', async (req, res) => {
  try {
    var XMLRes = req.body;
    JSONRes = XMLRes.message;

    //Extract data needed
    const transcriptFields = {};

    if (
      JSONRes.body[0].page[0].broadcastmetadata[0].viewershipdata[0]
        .nationalviewershipdata[0].programname[0]
    ) {
      transcriptFields.programName =
        JSONRes.body[0].page[0].broadcastmetadata[0].viewershipdata[0].nationalviewershipdata[0].programname[0];
    } else transcriptFields.programName = 'not given';

    if (
      JSONRes.body[0].page[0].broadcastmetadata[0].programinfo[0].$
        .ProgramDateTime
    ) {
      transcriptFields.date =
        JSONRes.body[0].page[0].broadcastmetadata[0].programinfo[0].$.ProgramDateTime;
    } else transcriptFields.date = 'not given';

    if (JSONRes.body[0].page[0].broadcastmetadata[0].station[0].location[0]) {
      transcriptFields.city = JSONRes.body[0].page[0].broadcastmetadata[0].station[0].location[0].split(
        ','
      )[0];
    } else transcriptFields.city = 'not given';

    if (JSONRes.body[0].page[0].broadcastmetadata[0].station[0].location[0]) {
      transcriptFields.state = JSONRes.body[0].page[0].broadcastmetadata[0].station[0].location[0].split(
        ','
      )[1];
    } else transcriptFields.state = 'not given';

    if (
      JSONRes.body[0].page[0].broadcastmetadata[0].station[0].stationname[0]
    ) {
      transcriptFields.station =
        JSONRes.body[0].page[0].broadcastmetadata[0].station[0].stationname[0];
    } else transcriptFields.station = 'not given';

    if (JSONRes.body[0].excerpts[0].transcriptexcerpt[0]._) {
      transcriptFields.fullText =
        JSONRes.body[0].excerpts[0].transcriptexcerpt[0]._;
    } else transcriptFields.fullText = 'not given';

    if (JSONRes.body[0].page[0].broadcastmetadata[0].transcripturl[0]) {
      transcriptFields.videoLink =
        JSONRes.body[0].page[0].broadcastmetadata[0].transcripturl[0];
    } else transcriptFields.videoLink = 'not given';

    //must add up duplicates later
    transcriptFields.viewership = 'n/a';
    transcriptFields.totalViewership = 'n/a';
    transcript = new Transcript(transcriptFields);
    await transcript.save();
    //res.json(transcriptFields);
  } catch (err) {
    console.error(err.msg);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
