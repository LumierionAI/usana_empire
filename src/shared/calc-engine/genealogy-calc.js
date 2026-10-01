/**
 * Evaluates the rank based on CP history.
 * Designed to accept an array for future weekly-history scenarios.
 * Returns an object with rendering data for the UI.
 */
export function evaluateRank(weeklyCps) {
  const currentCp = weeklyCps[0] || 0;
  
  if (currentCp >= 16000) {
    const stars = Math.floor((currentCp - 16000) / 1000);
    if (stars > 0) return { name: `${stars}-Star Diamond Director`, level: 'star-diamond', stars };
    return { name: "Diamond Director", level: 'diamond', stars: 0 };
  }
  if (currentCp >= 12000) return { name: "Emerald Director", level: 'emerald', stars: 0 };
  if (currentCp >= 8000) return { name: "Ruby Director", level: 'ruby', stars: 0 };
  if (currentCp >= 4000) return { name: "Gold Director", level: 'gold', stars: 0 };
  if (currentCp >= 1000) return { name: "Silver Director", level: 'silver', stars: 0 }; 
  if (currentCp >= 800) return { name: "Bronze Director", level: 'bronze', stars: 0 };
  if (currentCp >= 600) return { name: "Director", level: 'director', stars: 0 };
  if (currentCp >= 400) return { name: "Achiever", level: 'achiever', stars: 0 };
  if (currentCp >= 200) return { name: "Builder", level: 'builder', stars: 0 };
  if (currentCp >= 100) return { name: "Believer", level: 'believer', stars: 0 };
  if (currentCp >= 50) return { name: "Sharer", level: 'sharer', stars: 0 };
  return { name: "Brand Partner", level: 'none', stars: 0 };
}

export function simulateInteractiveTree(tree, pcState, exchangeRate) {
  let totalCp = 0;
  let totalNsbCp = 0; // Track NSB independently
  let rootPsp = 0;
  let pcPsp = Number(pcState?.psp) || 0;
  let hasBc2 = false;
  let hasBc3 = false;

  // 1. Calculate Root Qualification dynamically based on node PSP + Activation Volume
  if (tree) {
    rootPsp += (Number(tree.psp) || 0) + (Number(tree.activationVol) || 0);
    if (tree.left && tree.left.isBc2) { 
      rootPsp += (Number(tree.left.psp) || 0) + (Number(tree.left.activationVol) || 0); 
      hasBc2 = true; 
    }
    if (tree.right && tree.right.isBc3) { 
      rootPsp += (Number(tree.right.psp) || 0) + (Number(tree.right.activationVol) || 0); 
      hasBc3 = true; 
    }
  }
  
  // Preferred Customer PSP contributes to owner qualification
  rootPsp += pcPsp;

  let activeBcs = 0;
  if (rootPsp >= 200 && hasBc2 && hasBc3) activeBcs = 3;
  else if (rootPsp >= 100) activeBcs = 1;

  // Track matched GSP locally to apply the custom 1BC/3BC CP formulas
  let bc1Matched = 0;
  let bc2Matched = 0;
  let bc3Matched = 0;

  // 2. Traverse and Accumulate GSP
  function traverse(node) {
    if (!node) return 0;

    const leftVol = traverse(node.left);
    const rightVol = traverse(node.right);

    node.leftVol = leftVol; // Assign Left GSP
    node.rightVol = rightVol; // Assign Right GSP

    const nodePsp = Number(node.psp) || 0;
    const activationVol = Number(node.activationVol) || 0;
    
    // Calculate NSB. (10% of this node's total generated volume).
    if (node.isPersonallySponsored && node.nsbActive) {
      totalNsbCp += (nodePsp + activationVol) * 0.10;
    }
    
    // GSP passed upwards = Left GSP + Right GSP + Editable PSP + Activation Volume
    const nodeTotal = leftVol + rightVol + nodePsp + activationVol;

    // Calculate capped matching volume for root Business Centers
    let isNodeActive = false;
    if (node.isBc1 && activeBcs >= 1) isNodeActive = true;
    if ((node.isBc2 || node.isBc3) && activeBcs === 3) isNodeActive = true;

    if (isNodeActive) {
      let payoutVol = Math.min(leftVol, rightVol);
      payoutVol = Math.min(payoutVol, 5000);
      
      if (node.isBc1) bc1Matched = payoutVol;
      if (node.isBc2) bc2Matched = payoutVol;
      if (node.isBc3) bc3Matched = payoutVol;
    } else {
      node.cp = 0;
    }

    return nodeTotal;
  }

  traverse(tree);

  let error = null;
  if (tree && activeBcs === 0) {
    error = "Insufficient Owner PSP to qualify for commissions. Must maintain at least 100 PSP for 1BC or 200 PSP for 3BC.";
    totalCp = 0;
  } else if (tree) {
    // Apply exact CP formulas combining Owner PSP (BC1 + PC) and Matched GSP
    // IMPORTANT: Activation Volume does NOT yield a 20% self-bonus.
    let ownerPsp = (Number(tree.psp) || 0) + pcPsp;

    if (activeBcs === 3) {
      // NSB is calculated outside the 20% multiplier to yield a true 10% bonus
      totalCp = ((ownerPsp + bc1Matched + bc2Matched + bc3Matched) * 0.20) + totalNsbCp;
      
      // Distribute display CP for the UI nodes
      tree.cp = (ownerPsp + bc1Matched) * 0.20;
      if (tree.left) tree.left.cp = bc2Matched * 0.20;
      if (tree.right) tree.right.cp = bc3Matched * 0.20;
    } else if (activeBcs === 1) {
      totalCp = ((ownerPsp + bc1Matched) * 0.20) + totalNsbCp;
      tree.cp = totalCp;
    }
  }

  return {
    error,
    commissionPoints: totalCp,
    nsbCp: totalNsbCp, // Return NSB for UI display
    localCurrency: totalCp * exchangeRate,
    rankData: tree ? evaluateRank([totalCp]) : { name: "None", level: "none", stars: 0 }
  };
}