export function simulateInteractiveTree(tree, psp, bcCount, exchangeRate) {
  let activeBcs = (psp >= 200 && bcCount === 3) ? 3 : (psp >= 100 ? 1 : 0);
  
  let totalCp = 0;
  let totalPeople = 0;
  let totalVolume = 0;

  function traverse(node) {
    if (!node) return 0;
    
    if (!node.isBc1 && !node.isBc2 && !node.isBc3) {
      totalPeople++;
    }

    // Traverse bottom-up
    const leftVol = traverse(node.left);
    const rightVol = traverse(node.right);

    node.leftVol = leftVol;
    node.rightVol = rightVol;

    // Only leaf nodes possess their own volume
    const isLeaf = !node.left && !node.right;
    if (!isLeaf && !node.isBc1 && !node.isBc2 && !node.isBc3) {
      node.ownVol = 0; 
    }

    const nodeTotal = leftVol + rightVol + (Number(node.ownVol) || 0);
    
    if (!node.isBc1 && !node.isBc2 && !node.isBc3) {
      totalVolume += (Number(node.ownVol) || 0);
    }

    // Calculate payouts for root Business Centers
    let isNodeActive = false;
    if (node.isBc1 && activeBcs >= 1) isNodeActive = true;
    if ((node.isBc2 || node.isBc3) && activeBcs === 3) isNodeActive = true;

    if (isNodeActive) {
      let payoutVol = Math.min(leftVol, rightVol);
      payoutVol = Math.min(payoutVol, 5000);
      node.cp = payoutVol * 0.20;
      totalCp += node.cp;
    } else {
      node.cp = 0;
    }

    return nodeTotal;
  }

  traverse(tree);

  let error = null;
  if (activeBcs === 0) {
    error = "Insufficient Personal Sales Points (PSP) to qualify for commissions. Must be >= 100.";
    totalCp = 0;
  }

  return {
    error,
    totalPeople,
    totalVolume,
    commissionPoints: totalCp,
    localCurrency: totalCp * exchangeRate
  };
}