## Inventory Data Structure
---
This file describes the spawning algorithm.


Rooms vary in maturity which affect worker parts:

1. energy capacity determined by spawn + extensions
2. number of static harvesting/extraction points
3. controller level, which affects everything else

Additionally, the room's characteristics impact worker parts:
1. Distance between energy sources and controllers, spawns, production
2. Number of energy sources and 


A worker is a general purpose agent capable of performing any job.  The productivity of a room is limited by the room's composition.  In general, the following holds true:

1. each energy node requires a worker harvesting all of the time
2. each mineral node requires a worker harvesting some of the time
3. harvesting and extraction requires containers to be present nearby
4. all other activities can share workers most of the time

---
Worker part/number determination
```
1 worker / harvester
1 worker / extractor

W, C, M:  100 + 50 + 50 = 200  (8)
W, W, C, C, M, M:  200 + 100 + 100 = 400
W, W, W, C, C, C, M, M, M:  300 + 150 + 150 = 600
W, W, W, W, C, C, C, C, M, M, M, M:  400 + 150 + 150 = 800
W, W, W, W, W, C, C, C, C, C, M, M, M, M, M:  500 + 250 + 250 = 1000   (4)

C/M = W

Let Q = avg energy available over time

W = max(1, floor(Q / 200))

Let N = max num creeps
Let H = num harvesters with containers
Let E = num extractors with containers
Let X = max work parts (3)
Let C = cost of creep = 100W + 50C + 50M

N = E + H + 6

N = 8 - [(C - 200) / (1000 - 200) * (8 - 4)]
C = 200, N = 8
C = 1000, N = 4
