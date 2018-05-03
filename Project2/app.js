/*
*/

!function () {
    'use strict'
    //grid variables
    let currentGrid = [];
    let nextGrid = [];
    let food = [];
    let seed = [];
    let nearSeed = false;
    let direct, gridSize, foodSpawn, limitGrowth, range, foodCount, growthRange, minGrowthRange, startX, startY;
    
    //controllable variables
    var growthModel = {
        growth: 2.0,
        decay: 1.0,
        gridSize: 100,
        seedSize: 1,
        foodSpawn: true,
        limitGrowth: true,
        growthRange: 10,
        minGrowthRange: 2,
        foodCount: 150,
        growthColor: 0,
        bgColor: "white",
        rave: false,
        reset: function(){app.buildModel();},
        randomSeed: function(){app.randomSeed();},
    }
  
  const app = {
    canvas: null,
    ctx: null,
      
    init() { //initializer
      this.canvas = document.getElementsByTagName('canvas')[0]
      this.ctx = this.canvas.getContext( '2d' )
      this.draw = this.draw.bind( this )
      this.fullScreenCanvas() //establish canvas
      window.onresize = this.fullScreenCanvas.bind( this ) 
      this.buildModel();
      this.controls();
    },
      
    buildModel(){ //resets the grid
      gridSize = growthModel.gridSize;
      foodSpawn = growthModel.foodSpawn;
      limitGrowth = growthModel.limitGrowth;
      foodCount = growthModel.foodCount;
      growthRange = growthModel.growthRange;
      minGrowthRange = growthModel.minGrowthRange;
      seed.length = 0;
        
      requestAnimationFrame( this.draw )
        
      for( let i = 0; i < gridSize; i++){ //build grid
            currentGrid[i] = []
            nextGrid[i] = []
            for(let j = 0; j < gridSize; j++){
                direct = Math.floor(Math.random() * 4);
                range = Math.floor(Math.random() * growthRange + minGrowthRange);
                
                currentGrid[i][j] = {alive: false, age: 0, growth: growthModel.growth, decay: growthModel.decay, dying: false, state: "adult", direction: direct, seeking: false, range: range};
                nextGrid[i][j] = currentGrid[i][j];
            }
        } 
        
        startX = Math.floor(Math.random() * gridSize);
        startY = Math.floor(Math.random() * gridSize);
        
        for(let i = startX; i < startX + growthModel.seedSize; i++){ //set living seed
             for(let j = startY; j < startY + growthModel.seedSize; j++){
                 currentGrid[i][j].alive = true;
                 currentGrid[i][j].state = "seed"
                 seed[0] = {x: i, y: j};
             }
        } 
        
        if(foodSpawn){
            for(let i = 0; i < foodCount; i++){ //randomly generate food
                let fX = Math.floor(Math.random() * gridSize);
                let fY = Math.floor(Math.random() * gridSize);
            
            while(currentGrid[fX][fY].alive || currentGrid[fX][fY].state == "food"){
                fX = Math.floor(Math.random() * gridSize);
                fY = Math.floor(Math.random() * gridSize);
            }
            
                currentGrid[fX][fY].state = "food";
                food[i] = {x: fX, y: fY};
            }
        }
    },
      
    randomSeed(){ //randomly places a new seed
        startX = Math.floor(Math.random() * gridSize);
        startY = Math.floor(Math.random() * gridSize);
        
        while(currentGrid[startX][startY].alive){
            startX = Math.floor(Math.random() * gridSize);
            startY = Math.floor(Math.random() * gridSize);
        }
        
        
        for(let i = startX; i < startX + growthModel.seedSize; i++){ //set living seed
             for(let j = startY; j < startY + growthModel.seedSize; j++){
                 currentGrid[i][j].alive = true;
                 currentGrid[i][j].state = "seed"
                 seed.push({x: i, y: j});
             }
        } 
        
    },
      
    fullScreenCanvas() {
      this.canvas.width  = this.height = window.innerWidth
      this.canvas.height = this.width  = window.innerHeight
    },
    
    animate() {
        let swap = currentGrid;
        let neighbors;
        
        for( let i = 0; i < gridSize; i++){
            let row = currentGrid[i];
            for(let j = 0; j < gridSize; j++){
                let cell = row[j];
                cell.growth = growthModel.growth;
                cell.decay = growthModel.decay;
                neighbors = this.getNeighbors(i, j);
                
                if(cell.alive){ //if the seed is alive
                    if(cell.seeking){
                        cell.growth += 4;
                    }
                    else{
                        cell.growth = growthModel.growth;
                    }
                    
                    if(cell.state == "seed"){
                    }
                    else if(cell.dying && cell.state == "dying"){ //decay the cells age until it dies
                        cell.age -= cell.decay;
                        if(cell.age < 0){
                            cell.alive = false;
                            cell.state = "dead";
                        }
                    }
                    else{ //increase the cells age until it is fully grown at which point it starts dying
                        cell.age += cell.growth;
                        if(cell.age > 255){
                            cell.dying = true;
                            cell.state = "dying";
                        }
                        else if(cell.age < 255 && cell.dying == false){
                            cell.state = "adult";
                        }
                    }
                    
                    if(neighbors <= 2){ //if neighbor condition is met, check to grow a new cell 
                        if(this.checkFood(i, j)){ //check if there is a food source nearby
                            this.getFood(i, j); //set direction towards nearest food source
                            cell.seeking = true;
                        }
                        else{
                            cell.seeking = false;
                        }
                        
                        let a, b;
                        switch(currentGrid[i][j].direction){
                            case 0: //up
                                a = 0;
                                b = -1;
                                break;
                            case 1: //right
                                a = 1;
                                b = 0;
                                break;
                            case 2: //down
                                a = 0;
                                b = 1;
                                break;
                            case 3: //left
                                a = -1;
                                b = 0;
                                break;
                        }
                        
                        let col = (i + a + gridSize) % gridSize;
                        let row = (j + b + gridSize) % gridSize;
                        if(limitGrowth){
                            nearSeed = this.checkSeeds(i, j);
                        }
   
                        if(currentGrid[col][row].alive == false){
                            if(currentGrid[col][row].state == "food"){
                                currentGrid[col][row].state = "seed";
                                seed.push({x: col, y: row});
                            }
                            else if(this.checkFood(i, j)){
                                currentGrid[col][row].alive = true;
                            }
                            else if(limitGrowth){
                                if(nearSeed){
                                    currentGrid[col][row].alive = true;
                                }
                            }
                            else{
                                currentGrid[col][row].alive = true;
                            }
               
                        }
                        else{
                            cell.direction = Math.floor(Math.random() * 4);
                        }
                    }
                }
                else{
                    cell.age = 0;
                }
                
                nextGrid[i][j] = cell;
            }
        }      
        

        currentGrid = nextGrid;
        nextGrid = swap;
    },
    
    draw() {
        if(growthModel.sounds){
            app.play();
        }
        requestAnimationFrame( this.draw );
        this.animate();
          
        // draw to your canvas here
        this.ctx.fillStyle = growthModel.bgColor;
        this.ctx.fillRect( 0,0, this.canvas.width, this.canvas.height );
            
        let cellWidth = this.canvas.width/gridSize;
        let cellHeight = this.canvas.height/gridSize;
        
        let color = parseInt(growthModel.growthColor);
        let r, g, b;
    
        if(growthModel.rave){
            color = Math.floor(Math.random() * 6);
        }
        
        for( let i = 0; i < gridSize; i++){
            let row = currentGrid[i]
            let yPos = i * cellHeight
            for(let j = 0; j < gridSize; j++){
                let cell = row[j];
                let xPos = j * cellWidth;
                
                if(cell.state == "food"){
                    this.ctx.fillStyle = "rgb(230, 0, 120)";
                }
                else if(cell.state == "seed"){
                    this.ctx.fillStyle = "rgb(120, 130, 255)";
                }
                else if(cell.alive){
                        switch(color){
                        case 0:
                                r = 0;
                                g = 0;
                                b = cell.age;
                            break;
                        case 1:
                                r = cell.age;
                                g = 0;
                                b = 0;
                            break;
                        case 2:
                                r = 0;
                                g = cell.age;
                                b = 0;
                            break;
                        case 3:
                                r = cell.age;
                                g = cell.age;
                                b = 0;
                            break;
                        case 4:
                                r = 0;
                                g = cell.age;
                                b = cell.age;
                            break;
                        case 5:
                                r = cell.age;
                                g = 0;
                                b = cell.age;
                            break;
                    }
                    
                    this.ctx.fillStyle = "rgb(" + r + ", " + g + ", " + b + ")";
                }
                else if(cell.state == "dead"){
                    this.ctx.fillStyle = 'black';
                }
                else{
                    this.ctx.fillStyle = growthModel.bgColor;
                }
                this.ctx.fillRect( xPos, yPos, cellWidth, cellHeight );
              
            }
        }
    },
      
    getNeighbors(x, y){ //checks if direct neighbors are alive 
        let sum = 0;
        for(let i = -1; i <= 1; i++){
            for(let j = -1; j <= 1; j++){
                let col = (x + i + gridSize) % gridSize;
                let row = (y + j + gridSize) % gridSize;
                
                if(i == x && j == y){
                }
                else if(currentGrid[col][row].alive && currentGrid[col][row].state != "dying"){
                    sum++;
                }
                
            }
        }  
        
        return sum;
    },
      
    checkFood(x, y){ //checks if there is food within range
        //let nearFood = 0;
        
        for(let i = -10; i <= 10; i++){
            for(let j = -5; j <= 5; j++){
                let col = (x + i + gridSize) % gridSize;
                let row = (y + j + gridSize) % gridSize;

                if(currentGrid[col][row].state == "food"){
                    return true;
                }
            }  
        
            return false
        }
    },
      
    getFood(x, y){ //change direction to go towards food
        let dist = 0;
        let prev = 0;
        let shortest = 0;
        let target;
        
         for(let i = 0; i < food.length; i++){
            prev = dist;
            
            let dX = Math.abs(x - food[i].x);
            let dY = Math.abs(y - food[i].y);
            
            if(dX > gridSize/2){
                dX = gridSize - dX;
            }
            if(dY > gridSize/2){
                dY = gridSize - dY;
            }
            
            dist = Math.sqrt(dX * dX + dY * dY);
            if(dist < prev){
                target = i;
            }
           
        }
        
        let foodX = food[target].x;
        let foodY = food[target].y;
        let rand = 0;
        let dA,dB;
        
        //pathfinding
        if(foodX <= x || foodY <= y){ //up or left
            if(foodX < x && foodY < y){ //up and left
                dA = x - foodX;
                dB = y - foodY;
                
                
                //rand = Math.floor(Math.random * 1); //randomly decide between the options
                if(dA < dB){ 
                    currentGrid[x][y].direction = 0;
                }
                else{ 
                    currentGrid[x][y].direction = 3;
                }
            }
            else if(foodX < x && foodY >= y){ //left only
                currentGrid[x][y].direction = 3;
            }
            else if(foodX >= x && foodY < y){ //up only
                currentGrid[x][y].direction = 0;
            } 
        }
        if(foodX > x || foodY > y){ //down or right
            if(foodX > x && foodY > y){ //down and right
                dA = foodX - x;
                dB = foodY - y;
                
                //rand = Math.floor(Math.random * 1); //randomly decide between the options
                if(dA < dB){ 
                    currentGrid[x][y].direction = 1;
                }
                else{ 
                    currentGrid[x][y].direction = 2;
                }
            }
            else if(foodX > x && foodY <= y){ //right only
                currentGrid[x][y].direction = 1;
            }
            else if(foodX <= x && foodY > y){ //down only
                currentGrid[x][y].direction = 2;
            }
        }
             
    },
      
    checkSeeds(x, y){  //check distance from nearest seed
        let searchRange = Math.floor(currentGrid[x][y].range + (this.getCells()/2));
        
        for(let i = 0; i < seed.length; i++){
            let dX = Math.abs(x - seed[i].x);
            let dY = Math.abs(y - seed[i].y);
            
            if(dX > gridSize/2){
                dX = gridSize - dX;
            }
            if(dY > gridSize/2){
                dY = gridSize - dY;
            }
            
            let dist = Math.sqrt(dX * dX + dY * dY);
            if(dist < searchRange){
                return true;
            }
        }
        return false;
    },
    
    controls(){
        var gui = new dat.GUI({
            load: JSON,
            preset: 'Default'
        });
        var f1 = gui.addFolder('Starting Values');
        f1.add(growthModel, 'gridSize');
        f1.add(growthModel, 'foodSpawn');
        f1.add(growthModel, 'foodCount');
        f1.add(growthModel, 'limitGrowth');
        f1.add(growthModel, 'growthRange', 1, 10).step(1);
        f1.add(growthModel, 'minGrowthRange', 1, 5).step(1);
        
        var f2 = gui.addFolder('Color Values');
        f2.add(growthModel, 'growthColor', {Blue: 0, Red: 1, Green: 2, Yellow: 3, Cyan: 4, Magenta: 5 });
        f2.add(growthModel, 'bgColor', ['white', 'black']);
        f2.add(growthModel, 'rave');

        gui.add(growthModel, 'growth', 1, 10).step(1);
        gui.add(growthModel, 'decay', 1, 10).step(1);
        gui.add(growthModel, 'reset');
        gui.add(growthModel, 'randomSeed');
        
        gui.remember(growthModel);

    },
    getCells(){
        let alive = 0;
        for(let i = 0; i < gridSize; i++){
            for(let j = 0; j < gridSize; j++) {
                if(currentGrid[i][j].state == "alive"){
                    alive++;
                }
            }
        }
          
        return alive;
    }

  }
    window.onload = app.init.bind( app )

}()
