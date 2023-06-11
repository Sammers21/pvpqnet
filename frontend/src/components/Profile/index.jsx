import React, {useEffect, useState} from 'react';
import PageHeader from "../AppBar";
import Footer from "../Footer";
import {useParams} from "react-router-dom";
import axios from "axios";
import {baseUrl} from "../../config";
import {Box, Button, Card, CardActions, CardContent, CardMedia, Grid, Typography} from "@mui/material";
import {borderColor, containerBg} from "../../theme";
import {capitalizeFirstLetter} from "../../containers/Activity";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const Profile = () => {
  let {region, realm, name} = useParams();
  let [data, setData] = useState({});
  const [width, setWidth] = useState(window.innerWidth);
  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }
  const loadProfile = async () => {
    const data = (await axios.get(baseUrl + `/api/${region}/${realm}/${name}`)).data
    setData(data);
    console.log("data", data);
  };
  useEffect(() => {
    loadProfile();
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    }
  }, []);
  const isMobile = width <= 900;
  let realw = isMobile ? '100%' : '85%';
  let margin = '95px auto 45px auto';
  let shuffleBrackts = (data?.brackets ?? []).filter((bracket) => bracket.bracket_type.startsWith('SHUFFLE'));
  let shuffleBrackets = shuffleBrackts
    .map((bracket) => {
      let name = bracket.bracket_type.split('-')[1];
    return (<Grid item xs={12/shuffleBrackts.length} sx={{backgroundColor: borderColor}}>
      <Grid container xs={12}>
        <Grid item xs={6}>
          <h1>{name}</h1>
        </Grid>
        <Grid item xs={6}>
          <h1>{bracket.rating}</h1>
          <h1>{bracket.won}-{bracket.lost}</h1>
        </Grid>
      </Grid>
    </Grid>);
    });
  if(shuffleBrackets.length > 0){
    shuffleBrackets = (<Grid item xs={12} sx={{backgroundColor: borderColor}}>
      <h1>Shuffle</h1>
      <Grid container xs={12} spacing={2}>
        {shuffleBrackets}
      </Grid>
    </Grid>);
  }
  let pvpBrackts = (data?.brackets ?? []).filter((bracket) => bracket.bracket_type.startsWith('BATTLEGROUNDS') || bracket.bracket_type.startsWith('ARENA'))
    .map((bracket) => {
      let name
      let format
      if (bracket.bracket_type.startsWith('BATTLEGROUNDS')) {
        name = 'Battlegrounds';
        format = '10v10'
      } else {
        name = 'Arena';
        format = bracket.bracket_type.split('_')[1];
      }
    return (<Grid item xs={12} sx={{backgroundColor: borderColor}}>
      <Grid container xs={12}>
        <Grid item xs={6}>
          <h1>{format}</h1>
          <h2>{name}</h2>
        </Grid>
        <Grid item xs={6}>
          <h1>{bracket.rating}</h1>
          <h1>{bracket.won}-{bracket.lost}</h1>
        </Grid>
      </Grid>
    </Grid>);
  });
  document.title = `${capitalizeFirstLetter(name)}-${capitalizeFirstLetter(realm)}`;
  var mainRaw =""
  var avatar = ""
  var insert =""
  if (data.media) {
    mainRaw = data.media.main_raw;
    avatar = data.media.avatar;
    insert = data.media.insert;
  }
  const openInNewTab = (url) => {
    window.open(url, "_blank", "noreferrer");
  };
  return (
    <>
      <PageHeader/>
      <Grid container spacing={2} sx={{paddingTop: '105px', backgroundColor: containerBg,}}>
        <Grid item xs={6} sx={{ backgroundSize: 'cover', backgroundPosition: 'center',}}>
          <h1>{data.name}-{data.realm}</h1>
          {/*<Box*/}
          {/*  component="img"*/}
          {/*  sx={{*/}
          {/*    height: 233,*/}
          {/*    width: 350,*/}
          {/*    maxHeight: { xs: 233, md: 167 },*/}
          {/*    maxWidth: { xs: 350, md: 250 },*/}
          {/*  }}*/}
          {/*  alt="The house from the offer."*/}
          {/*  src={mainRaw}*/}
          {/*/>*/}
          {/*<Box*/}
          {/*  component="img"*/}
          {/*  sx={{*/}
          {/*    height: 233,*/}
          {/*    width: 350,*/}
          {/*    maxHeight: { xs: 233, md: 167 },*/}
          {/*    maxWidth: { xs: 350, md: 250 },*/}
          {/*  }}*/}
          {/*  alt="The house from the offer."*/}
          {/*  src={avatar}*/}
          {/*/>*/}
          <Box
            component="img"
            sx={{
              // height: 233,
              // width: 350,
              // maxHeight: { xs: 233, md: 167 },
              // maxWidth: { xs: 350, md: 250 },
            }}
            alt="The house from the offer."
            src={insert}
          />
          <Card sx={{maxWidth: 700}}>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Talents
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.talents}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => {
                openInNewTab("https://www.wowhead.com/talent-calc/blizzard/" + data.talents)
              }}>Wowhead</Button>
              <Button size="small" onClick={() => {
                navigator.clipboard.writeText(data.talents).then(function() {
                  console.log('Copying to clipboard was successful!');
                }, function(err) {
                  console.error('Async: Could not copy text: ', err);
                });
              }}>Copy</Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid container xs={6} spacing={2}>
          {shuffleBrackets}
          {pvpBrackts}
        </Grid>
      </Grid>
      <Footer/>
    </>
  );
}

export default Profile;