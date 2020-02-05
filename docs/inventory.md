## Inventory Data Structure
---
This file describes the in-memory data structure that is used by the InventoryGoal object to manage inventory levels and buy/sell orders.

```
inv: {
    resourceType: {

        // amount desired of the resource in storage or terminal
        desired: value,

        // the lowest price/unit that the supervisor should sell
        // any surplus units (lots of 2000s)
        sellLimit: value
        
    }
}
```
