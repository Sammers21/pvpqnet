import React, { useEffect, useState } from "react";
import { Grid, Link, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import GitHubIcon from "@mui/icons-material/GitHub";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
const Footer = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    window.addEventListener("resize", function () {
      setWidth(window.innerWidth);
    });
    return () => {
      window.removeEventListener("resize", function () {
        setWidth(window.innerWidth);
      });
    };
  }, []);
  const isMobile = width <= 900;
  let justifyContent = "space-between";
  if (isMobile) {
    justifyContent = "center";
  }
  let madeBySammers = (
    <Grid>
      Made by<span> </span>
      <Link underline="none" href="https://github.com/Sammers21">
        Sammers
      </Link>
    </Grid>
  );
  let properStar = (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Link
        href="https://github.com/Sammers21/pvpqnet"
        color="#FFFFFF"
        sx={{
          textDecoration: "none",
          boxShadow: "none",
          display: "flex",
          alignItems: "center",
        }}
      >
        <GitHubIcon sx={{ marginLeft: "4px" }} />
      </Link>
      <Link
        href="https://discord.com/users/343752113752506379"
        color="#FFFFFF"
        sx={{
          textDecoration: "none",
          boxShadow: "none",
          display: "flex",
          alignItems: "center",
        }}
      > 
      <Box sx={{ marginLeft: "8px" }}> <FontAwesomeIcon icon={faDiscord}/></Box>
      </Link>
    </Box>
  );
  return (
    <Grid
      sx={{
        position: "fixed",
        display: "flex",
        justifyContent: justifyContent,
        bottom: 0,
        left: 0,
        padding: "6px 32px",
        border: "1px #2f384de6 solid",
        background: "#141415",
        width: "100%",
      }}
    >
      {madeBySammers}
      {!isMobile && properStar}
    </Grid>
  );
};

export default Footer;
