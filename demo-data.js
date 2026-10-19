/* Invented simulation data. These curves do not contain measured business results. */
window.LOSS_DATA={snapshots:{'all|全部':{structure:{scenarios:[
  {action:'配送调整示例',associatedLoss:1200,applicableOrders:400,curve:Array.from({length:5},(_,i)=>({step:i,turnedNonLoss:i*35,profitLift:i*180,recoverableLoss:i*150}))},
  {action:'活动调整示例',associatedLoss:1600,applicableOrders:500,curve:Array.from({length:6},(_,i)=>({step:i+1,turnedNonLoss:(i+1)*22,profitLift:(i+1)*110,recoverableLoss:(i+1)*100}))}
]}}}};
