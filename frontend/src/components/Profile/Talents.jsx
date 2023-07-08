import {Button, Card, CardActions, CardContent, Typography} from "@mui/material";
import React from "react";

const Talents = ({data}) => {
  const openInNewTab = (url) => {
    window.open(url, "_blank", "noreferrer");
  };
  let talents = <Card sx={{maxWidth: '100%'}}>
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
        navigator.clipboard.writeText(data.talents).then(function () {
        }, function (err) {
          console.error('Async: Could not copy text: ', err);
        });
      }}>Copy</Button>
    </CardActions>
  </Card>;
  return talents;
}
export default Talents;