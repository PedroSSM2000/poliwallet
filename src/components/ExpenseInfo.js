import { Box, Card, Collapse, Stack, Typography } from "@mui/material";
import { collection } from "firebase/firestore";
import React, { useMemo } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { useSelector } from "react-redux";
import { auth, db } from "../services/firebase";
import calculateRate from "../utils/calculateRate";
import Donut from "./Donut";
import { colorMap } from "./History";

export default function ExpenseInfo() {
  const [user] = useAuthState(auth);
  const userExpenses = collection(db, `userData/${user.uid}/expenses`);

  let [expenses, loading] = useCollectionData(userExpenses);

  expenses = expenses || [];

  const total = useMemo(
    () => expenses.reduce((acc, curr) => acc + calculateRate(curr), 0),
    [expenses]
  );

  const tags = useMemo(
    () =>
      expenses.reduce((acc, curr) => {
        const { tag } = curr;
        const amount = calculateRate(curr);
        const percentage = (amount / total) * 100;
        if (acc[tag] !== undefined)
          acc[tag] = {
            percentage: percentage + acc[tag].percentage,
            amount: amount + acc[tag].amount,
          };
        else acc[tag] = { percentage, amount };
        return acc;
      }, {}),
    [expenses, total]
  );

  let tagsArray = useMemo(() => Object.entries(tags), [tags]);

  tagsArray = useMemo(
    () => tagsArray.sort((a, b) => b[1].percentage - a[1].percentage),
    [tagsArray]
  );

  if (loading) return null;

  const shouldRender = expenses.length > 0;

  function dotStyle(tag) {
    return {
      width: "0.625rem",
      height: "0.625rem",
      mr: 1.5,
      borderRadius: 4,
      bgcolor: colorMap[tag],
    };
  }

  return (
    <Collapse unmountOnExit in={shouldRender}>
      <Box sx={{ px: 2 }}>
        <Typography mb={1} ml={1.5} variant="h6">
          Your expense sources
        </Typography>
        <Card
          sx={{
            display: "flex",
            alignItems: "center",
            p: 2,
            borderRadius: "0.5rem",
          }}
        >
          <Donut data={tagsArray} height="7rem" />
          <Stack
            spacing={0.5}
            alignItems="stretch"
            justifyContent={tagsArray.length > 3 ? "center" : "flex-start"}
            sx={{ alignSelf: "stretch", ml: 2, flexGrow: 1, py: 0.5 }}
          >
            {tagsArray.slice(0, 5).map(([tag, { percentage, amount }]) => (
              <Stack key={tag} direction="row" justifyContent="space-between">
                <Stack direction="row" alignItems="center">
                  <Box sx={dotStyle(tag)} />
                  <Typography variant="body2">
                    {tag}: {Math.round(percentage) || percentage.toFixed(1)}%
                  </Typography>
                </Stack>
                <Typography textAlign="right" variant="body2">
                  {amount.toFixed(2)} BRL
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Card>
      </Box>
    </Collapse>
  );
}
