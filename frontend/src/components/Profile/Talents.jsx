import {alpha, Button, Card, CardActions, CardContent, Typography} from "@mui/material";
import React from "react";
import {aroundColor, borderRadius} from "../../theme";
import Box from "@mui/material/Box";

const Talents = ({isMobile, data}) => {
  const openInNewTab = (url) => {
    window.open(url, "_blank", "noreferrer");
  };
  let talents =
    <Box
      margin={isMobile ? 0 : 1}
      padding={isMobile ? 0 : 1}
      paddingTop={0}
      paddingBottom={0}
      marginTop={1}
      marginBottom={0}
  sx={{
    // width:'100
    }}>
      <Card
        sx={{
          borderRadius: borderRadius,
          backgroundColor: alpha(aroundColor, 0.3),
        }}>
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
      </Card>
    </Box>;
  return talents;
}
export default Talents;