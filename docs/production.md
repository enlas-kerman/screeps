## Production Data Structure
---
This file describes the in-memory data structure to describe
production schema and goals

```

// memory root for prodution (per room)
production: {

    labs: {

        // a production line which specifies a reaction schema
        // the line will continue to produce resources on the output
        // until output.remaining = 0
        "line1": {

            // description of the first input into the reaction
            input1: {

                // id of the lab
                id: objectid1,

                // the type of resource
                resource: resourceType1,

                // amount of resource that must be loaded into the lab
                // to fully produce output.remaining of the output resource
                remaining: value
            },

            // description of the second input into the reaction
            input2: {
                id: objectid2,
                resource: resourceType2
            },

            // description of the reaction output
            output: {

                // the lab that will receive the output
                id: objectid3,

                // the type of resource being produced
                resource: resourceType3,

                // the amount of output resource to be produced
                remaining: value
            }
        }
        
    }
}
```