/*

Created by: Császár Mózes (mozescsaszar@gmail.com)
Code use is only permitted for personal, non-commercial or non-commercial cases. Please don't 
use or reuse part of the project in an application released to target audiences greater than
family or close circle of friends.

*/
var Unlockables = {};

const UtilityFunctions = {
    get_compare_color(value1,value2, decimal = true) {
        if(decimal) {
            if(value1.gt(value2)) {
                return 'red';
            }
            else if(value1.lt(value2)) {
                return 'green';
            }
            else {
                return 'black';
            }
        }
        else {
            if(value1 == value2) {
                return 'black';
            }
            if(value1 > value2) {
                return 'red';
            }
            else {
                return 'green';
            }
        }
    },
}
//a class to handle price, created to accept multiple functions across multiple intervals
class PriceHandler {
    constructor(stop_points = [], types = ['ar'], coefficients = [new Decimal(0)], start_price = new Decimal(0)) {
        this.stop_points = stop_points;
        this.stop_points.unshift(new Decimal(0));
        this.stop_points.push(new Decimal(Infinity));
        this.coefficients = coefficients;
        this.coefficients.unshift(start_price);
        this.types = types;
        this.types.unshift('ar');
        this.stop_point_values = [coefficients[0]];
        for(let i = 1; i < stop_points.length; i++) {
            if(types[i] == 'ar') {
                this.stop_point_values[i] = this.stop_point_values[i-1].add( this.stop_points[i].sub(this.stop_points[i-1]).mul(this.coefficients[i]) );
            }
            else if(types[i] == 'ge') {
                this.stop_point_values[i] = this.stop_point_values[i-1].mul(this.stop_points[i].sub(this.stop_points[i-1]).pow(this.coefficients[i]));
            }
        }
    }

    get_price(nr_owned, to_buy) {
        let i = 0;
        while(this.stop_points[i].lte(nr_owned)) {
            i++;
        }
        //get start price
        let start_price = this.stop_point_values[i-1];
        let new_price = new Decimal(0);
        //calculate new price
        while(to_buy.gt(new Decimal(0))) {
            let upper_border = nr_owned.add(to_buy).gt(this.stop_points[i]) ? this.stop_points[i].sub(nr_owned) : to_buy;
            if(this.types[i] == 'ar') {
                new_price = new_price.add( Decimal.sumArithmeticSeries(upper_border, start_price, this.coefficients[i], nr_owned.sub(this.stop_points[i-1])) );
            }
            else if(this.types[i] == 'ge') {
                new_price = new_price.add( Decimal.sumGeometricSeries(upper_border, start_price, this.coefficients[i], nr_owned.sub(this.stop_points[i-1])) );
            }
            start_price = this.stop_point_values[i];
            i++;
            to_buy = to_buy.sub(upper_border);
            nr_owned = nr_owned.add(upper_border);
        }
        return new_price;
    }
}

//elemental circle: fire -> nature -> water -> earth -> fire

/*
    A class which handles substats, containing values for physical, magic, fire, water, earth and nature.
    Public variables contain useable strings for creating string representation
*/
class SubStats {
    static text_start = '<span style="color:';
    static type_color = {'physical' : 'black">', 'magic' : 'purple">', 'fire' : 'red">', 'water' : 'blue">', 'earth' : 'brown">', 'nature' : 'green">'}
    static type_end= {'physical' : '⬟</span>', 'magic' : '⬣</span>', 'fire' : '■</span>', 'water' :  '■</span>', 'earth' :  '■</span>', 'nature' :  '■</span>'}

    /*
        Create a new SubStats object from decimal values.
    */
    constructor(physical = new Decimal(0), magic = new Decimal(0), fire = new Decimal(0), water = new Decimal(0), earth = new Decimal(0), nature = new Decimal(0)) {
        this.physical = physical;
        this.magic = magic;
        this.fire = fire;
        this.water = water;
        this.earth = earth;
        this.nature = nature;
    }
    
    /*
        Add a substat object to the current one, returning the resulting substat.
    */
    add(other) {
        var a = new SubStats();
        for(let e in a) {
            a[e] = this[e].add(other[e]);
        }
        return a;
    }

    /*
        Substract a substat object from the current one, returning the resulting substat.
    */
    sub(other) {
        var a = new SubStats();
        for(let e in a) {
            a[e] = this[e].sub(other[e]);
        }
        return a;
    }

    /*
        Multiply a substat object by the current one, returning the resulting substat.
        Multiply a substat by a Decimal() number, returning a new substats object with the result.
    */
    mul(other) {
        var a = new SubStats();
        //if it is a SubStat that you are multiplying by, take if by elements
        if(other.isNull) {
            for(let e in a) {
                a[e] = this[e].mul(other[e]);
            }
        }
        else {
            for(let e in a) {
                a[e] = this[e].mul(other);
            }
        }
        return a;
    }

    /*
        Divide the current substats by another one, returning the resulting substat.
        Divide the current substats by a Decimal() number, returning a new substats object with the result.
    */
    div(other) {
        var a = new SubStats();
        if(other.isNull) {
            for(let e in a) {
                if(other[e] != 0) {
                    a[e] = this[e].div(other[e]);
                }
            }
        }
        else {
            if(other[e] != 0) {
                for(let e in a) {
                    a[e] = this[e].div(other);
                }
            }
        }
        
        return a;
    }

    isNull() {
        for(let e in this) {
            if(this[e] != 0) {
                return false;
            }
        }
        return true;
    }

    /*
        Return a string (HTML) representation of the substrats object.
    */
    get_text() {
        let t = '';
        if(this.isNull()) {
            return '0';
        }
        for(let e in this) {
            if(this[e] != 0) {
                t += SubStats.text_start + SubStats.type_color[e] + StylizeDecimals(this[e]) + SubStats.type_end[e] + '&nbsp';
            }
        }
        return t;
    }

    //get the elemental attributly unmodified power of attack or defense
    get_plain_power() {
        let pow = new Decimal(0);
        for(let e in this) {
            pow = pow.add(this[e]);
        }
        return pow;
    }
}

/*
    A class to store data related to stats.
    Uses SubStats for complex (or multi-variable stats) like attack and defense.
*/
class Stats {
    constructor(stat_names = ['Attack', 'Defense'], stat_substats = [new SubStats(), new SubStats()]) {
        for(let i = 0; i < stat_names.length; i++) {
            this[stat_names[i]] = stat_substats[i];
        }
    }

    /*
     A function to add a Stats object to another. Returns a new object, the old remaining unchanged.
     Input: other - another Stats object
    Output: the object which is the result of addition
    */
    add(other) {
        let a = new Stats([],[]);
        for(let ss in other) {
            if(this[ss] == undefined) {
                if(other[ss].get_text) {
                    a[ss] = other[ss].add(new SubStats);
                }
                else {
                    a[ss] = new Decimal(other[ss]);
                }
            }
            else {
                a[ss] = this[ss].add(other[ss]);
            }
        }
        return a;
    }

    sub(other) {
        let a = new Stats([],[]);
        for(let ss in other) {
            if(this[ss] == undefined) {
                if(other[ss].get_text) {
                    a[ss] = other[ss].mul(new Decimal(-1));
                }
                else {
                    a[ss] = new Decimal(other[ss].mul(-1));
                }
            }
            else {
                a[ss] = this[ss].sub(other[ss]);
            }
        }
        return a;
    }

    mul(other) {
        let a = new Stats([],[]);
        if(other.text) {
            for(let ss in other) {
                if(this[ss] != undefined) {
                        a[ss] = this[ss].mul(other[ss]);
                        
                }
            }
        }
        else {
            for(let ss in this) {
                if(this[ss] != undefined) {
                    a[ss] = this[ss].mul(other);
                }
            }
        }
        
        return a;
    }

    div(other) {
        let a = new Stats();

        if(other.get_text) {
            for(let ss in other) {
                if(this[ss] != undefined) {
                    if(other[ss].get_text) {
                        if(!other[ss].isNull) {
                            a[ss] = this[ss].div(other[ss]);
                        }
                    }
                    else {
                        if(other[ss] != 0) {
                            a[ss] = this[ss].div(other[ss]);
                        }
                    }   
                }
            }
        }
        else {
            for(let ss in this) {
                if(this[ss] != undefined) {
                    a[ss] = this[ss].mul(other);
                }
            }
            for(let ss in this) {
                if(other != 0) {
                    a[ss] = this[ss].div(other);
                }
                else {
                    a[ss] = this[ss].mul(new Decimal(1));
                }   
            }
        }

       
        return a;
    }

    /*
        Get the string(HTML) representation of the thing with a newline at the end.
    */
    get_text() {
        let t = '';
        for(let ss in this) {
            if(this[ss].get_text != undefined) {
                if(!this[ss].isNull()) {
                    t += ss + ':' + this[ss].get_text() + '<br>';
                }
            }
            else {
                if(this[ss] != 0) {
                    t += ss + ':' + StylizeDecimals(this[ss]) + '<br>';
                }
            }
        }
        return t;
    }

    /*
        Get HTML string which represents the result of the comparison to current object.
    */
    get_compare_text(other) {
        let a = this.add(other);
        let t = '';
        for(let ss in a) {
            t += ss + ': ';
            if(this[ss] == undefined) {
                if(other[ss].get_text) {
                    t += '0 → ' + other[ss].get_text();
                }
                else {
                    t += '0 → ' + StylizeDecimals(other[ss]);
                }
            }
            else if(other[ss] == undefined) {
                if(this[ss].get_text) {
                    t += this[ss].get_text() + ' → ';
                }
                else {
                    t += StylizeDecimals(this[ss]) + ' → 0';
                }
            }
            else {
                if(this[ss].get_text) {
                    t += this[ss].get_text() + ' → ' + other[ss].get_text();
                }
                else {
                    t += StylizeDecimals(this[ss]) + ' → ' + StylizeDecimals(other[ss]);
                }
            }
            t += '<br>';
        }
        return t;
    }

    //get the elemental attributly unmodified power of attack or defense
    get_plain_power(type = 'Attack||Defense') {
        if(this[type]) {
            return this[type].get_plain_power();
        }
        return new Decimal(0);
    }

    //get the elemental attributly modified power of attack or defense
    get_power(stats_b, type_a = 'Attack||Defense', type_b = 'Defense||Attack') {
        let pow = new Decimal(0);

        if(this[type_a]) {
            pow = this[type_a].get_plain_power();
        }
        else {
            return pow;
        }
        if(!stats_b[type_b]) {
            return pow;
        }

        if(this[type_a].fire.gt(0)) {
            pow = pow.add(stats_b[type_b].nature.abs().min(this[type_a].fire).mul(new Decimal(0.5)));
            if(stats_b[type_b].earth.gt(0)) {
                pow = pow.sub(stats_b[type_b].earth.min(this[type_a].fire).mul(new Decimal(0.5)));
            }
        }
        if(this[type_a].nature.gt(0)) {
            pow = pow.add(stats_b[type_b].water.abs().min(this[type_a].nature).mul(new Decimal(0.5)));
            if(stats_b[type_b].earth.gt(0)) {
                pow = pow.sub(stats_b[type_b].fire.min(this[type_a].nature).mul(new Decimal(0.5)));
            }
        }
        if(this[type_a].water.gt(0)) {
            pow = pow.add(stats_b[type_b].earth.abs().min(this[type_a].water).mul(new Decimal(0.5)));
            if(stats_b[type_b].earth.gt(0)) {
                pow = pow.sub(stats_b[type_b].nature.min(this[type_a].water).mul(new Decimal(0.5)));
            }
        }
        if(this[type_a].earth.gt(0)) {
            pow = pow.add(stats_b[type_b].fire.abs().min(this[type_a].earth).mul(new Decimal(0.5)));
            if(stats_b[type_b].earth.gt(0)) {
                pow = pow.sub(stats_b[type_b].water.min(this[type_a].earth).mul(new Decimal(0.5)));
            }
        }

        return pow;
    }
}

//Army Component Stuff can have as stats: attack, defense

class Creature {
    constructor(name = 'None', desc = 'None',stats = new Stats(), hands = 0, price_handeler = new PriceHandler()) {
        this.name = name;
        this.desc = desc;
        this.stats = stats;
        this.hands = hands;
        this.price_handeler = price_handeler;
    }

    //placeholder function
    get_price(nr_owned, to_buy) {
        return this.price_handeler.get_price(nr_owned,to_buy);
    }

    get_compare_text(other) {
        return  'Name: ' + this.name + ' → ' + other.name + '<br>' +
        this.stats.get_compare_text(other.stats) + 
        'Hands: ' + this.hands + ' → <span style="color:' + UtilityFunctions.get_compare_color(this.hands,other.hands,false) + ';">' + other.hands + '</span><br>';
    }

    get_text() {
        return '<b>Name: ' + this.name + '</b><br>' +
        this.stats.get_text() +
        '<br>' +
        'Hands: ' + this.hands + '<br>' +
        '<br><i>' + this.desc + '</i>';
        
    }
}

class Weapon {
    constructor(name = 'None', desc = 'None', stats = new Stats(['Attack'],[new SubStats()]), hands_needed = 0, price_handeler = new PriceHandler()) {
        this.name = name;
        this.desc = desc;
        this.stats = stats;
        this.hands_needed = hands_needed;
        this.price_handeler = price_handeler;
    }

    //placeholder function
    get_price(nr_owned, to_buy) {
        return this.price_handeler.get_price(nr_owned,to_buy);
    }

    get_compare_text(other) {
        return '<b>Name: ' + this.name + ' → ' + other.name + '</b><br>' +
        this.stats.get_text() + 
        'Hands needed: ' + this.hands_needed + ' → <span style="color:' + UtilityFunctions.get_compare_color(other.hands_needed, this.hands_needed, false) + ';">' + other.hands_needed + '</span><br>';

    }

    get_text() {
        return '<b>Name: ' + this.name + '</b><br>' +
        this.stats.get_text() +
        '<br>' +
        'Hands: ' + this.hands_needed + '<br>' +
        '<br><i>' + this.desc + '</i>';
        
    }
}

//used for boss and miniboss fights
class Boss {
    constructor(name, desc, stats) {
        this.stats = stats;
        this.name = name;
        this.desc = desc;
    }
}


//a function to adjust the appearance of decimal numbers (e form and trying to avoid inconsistent numbers messing up the interface, like 48.0000001 instead of 48)
function StylizeDecimals(decimal, floor = false) {
    if(decimal.exponent >= 6) {
        return decimal.mantissa.toFixed(2) + 'e' + decimal.exponent;
    }
    if(!floor) {
        if(decimal.exponent > 2){
            return (decimal.mantissa*Math.pow(10,decimal.exponent)).toFixed(0);
        }
        else {
            return (decimal.mantissa*Math.pow(10,decimal.exponent)).toFixed(2-decimal.exponent);
        }
    }
    else {
        return (decimal.mantissa*Math.pow(10,decimal.exponent)).toFixed(0);
    }
    
}

//IF YOUD ADD SOMETHING THAT USES MULTIPLE BODY PARTS, CHANGE THE STUFF WHERE IT SAIS: CHANGE 1 HERE
stuff = {
    //Here are the weapons useable in the game
    weapons : {
        'None' : new Weapon(),
        'Knife' : new Weapon('Knife', 'A thrustworthy knife, even if it is not the best for your needs. Simple to use and reliable.', new Stats(['Attack'], [new SubStats(new Decimal(1))]), 1, new PriceHandler([new Decimal(100),new Decimal(1000), new Decimal(10000)],['ar','ar','ar','ar'],[new Decimal(0.07), new Decimal(1),new Decimal(15),new Decimal(220)],new Decimal(15) ) ),
        'Dagger' : new Weapon('Dagger','A bit better than a knife, but priceier too.', new Stats(['Attack'], [new SubStats(new Decimal(1.2))]),1, new PriceHandler([new Decimal(100),new Decimal(300), new Decimal(600), new Decimal(1000)],['ar','ar','ar','ar', 'ar'],[new Decimal(0.5), new Decimal(2),new Decimal(7), new Decimal(16),new Decimal(225)],new Decimal(500)) ),
        'Longsword' : new Weapon('Longsword','A twohanded sword, strong against unarmored opponents', new Stats(['Attack'], [new SubStats(new Decimal(2.5))]), 2, new PriceHandler([new Decimal(30),new Decimal(300), new Decimal(300)],['ar','ar','ge','ge'],[new Decimal(30), new Decimal(300),new Decimal(1.03),new Decimal(1.1)],new Decimal(25)) ),
    },
    //Here are all the creatures useable in the game
    creatures : {
        'None' : new Creature(),
        'Human' : new Creature('Human','A cheap and reliable worker. Not too efficient, but this is the best you will get for your money.', new Stats(['Attack'], [new SubStats(new Decimal(1))]), 2, new PriceHandler([new Decimal(100),new Decimal(1000), new Decimal(10000)],['ar','ar','ar','ar'],[new Decimal(0.03), new Decimal(0.5),new Decimal(10),new Decimal(100)],new Decimal(5) ))
    },
    bosses : {
        'Slime' : new Boss( 'Slime', 'A giant slime with a giant ego. He is the guardian of the exit of the first floor.', new Stats(['Attack', 'Defense', 'Health'],[new SubStats(new Decimal(5)), new SubStats(new Decimal(10)), new Decimal(10000)])),
    }
}
//regular save divider = '/*/'
class Army {
    static level_bonuses = [new Decimal(1), new Decimal(1.1), new Decimal(1.2), new Decimal(1.3), new Decimal(1.5), new Decimal(2)];
    static level_prices = [new Decimal(1000), new Decimal(10000), new Decimal(150000), new Decimal('2.3e6'), new Decimal('3e7')];

    constructor(creature = 'None', weapons = ['None','None','None','None','None','None','None','None'], hands = 0, stats = new Stats(), size = new Decimal(0), raiding = -1) {
        this.creature = creature;
        this.weapons = weapons;
        this._hands = hands;
        this._stats = stats;
        this._size = size;
        this.level = 0;
        this.level_bonus = new Decimal(1);
        this.raiding = -1;

        this.power = new Decimal(1);
    }

    get hands() {
        return this._hands;
    }

    set hands(value) {
        this._hands = value;
    }

    get stats() {
        return this._stats.mul(this.level_bonus);
    }

    set stats(other) {
        this._stats = other;
    }

    get size() {
        return this._size;
    }

    set size(value) {
        this._size = value;
    }

    //the function that decides what to do when a level up is requested
    level_up() {
        if(this.level < Army.level_prices.length && Army.level_prices[this.level].lt(Player.gold)) {
            Player.gold = Player.gold.sub(Army.level_prices[this.level]);
            this.level_up_helper();
        }
    }
    //the function that does the level up
    level_up_helper() {
        this.level++;
        this.level_bonus = this.level_bonus.mul(Army.level_bonuses[this.level]);
        
    }

    level_down(to_level) {
        while(this.level > to_level) {
            this.level_bonus = this.level_bonus.div(Army.level_bonuses[this.level]);
            this.level--;
        }
    }

    get_level_up_text() {
        this.level_up_helper();
        const new_army = [this.size,this.stats, this.hands]
        this.level_down(this.level - 1);
        return this.get_compare_text(new_army);
    }

    get_compare_level_text() {
        if(this.level >= Army.level_bonuses.length) {
            return 'Max level reached, cannot upgrade further, sorry. :)';
        }
        return 'Power multiplier: ' + StylizeDecimals(this.level_bonus) + ' → <span style="color:' + 
        UtilityFunctions.get_compare_color(this.level_bonus, this.level_bonus.mul(Army.level_bonuses[this.level + 1])) + '">' +
        StylizeDecimals(this.level_bonus.mul(Army.level_bonuses[this.level + 1])) + '</span>';
    }

    //TODO: Handle hands
    change_element(type, change_to, change_index = 0, change_visuals = true) {
        //if we are talking about a creature, then the change is big
        switch(type) {
            case 'creatures':
                //reset the size of the army
                this.set_size(new Decimal(0));
                //unequip all the army

                //get the stuff visible / created (the selects and their other parts)
                //and remove elements
                if(change_visuals) {
                    for(let i = this.weapons.length - 1; i > -1; i--) {
                        this.change_element('weapons','None',i);
                        ArmyPage.selects.weapons[i].parentElement.hidden = true;
                        ArmyPage.selects.weapons[i].value = 'None';
                    }
                    if(change_to != 'None') {
                        ArmyPage.selects.weapons[0].parentElement.hidden = false;
                    }
                }
                this.stats = this._stats.sub(stuff.creatures[this.creature].stats);
                this.hands = this._hands - stuff.creatures[this.creature].hands;
                //change the stats of the army
                this.creature = change_to;
                this.stats = this._stats.add(stuff.creatures[this.creature].stats);
                this.hands = this._hands + stuff.creatures[this.creature].hands;
                break;
            case 'weapons':
                if(change_to == this.weapons[change_index]) {
                    return;
                }
                if(change_visuals) {
                    this.change_element_helper('weapons',change_to,['hands','hands_needed'],change_index)
                }
                else {
                    this.change_element_helper_without_visuals('weapons',change_to,['hands','hands_needed'],change_index)
                }
                break;
        }
        //send unlock request after change
        if(change_visuals) {
            Unlockables.unlock(['army','power'],this.power);
            Unlockables.unlock(['army','size'],this.size);
        }
        
    }
    //helps to change the stuff that is not creature in your army
    change_element_helper(type, change_to, bodyparts = ['hands','hands_needed'], change_index = 0) {
        if(change_to == this[type][change_index]) {
            return;
        }
        //if there are enough hands for the weapon
        let i;
        //check if you can change the thing, if not, then reset the selecter from which you tried to set it and return false
        for(i = 0; i < bodyparts.length; i += 2) {
            if( this[bodyparts[0]] + stuff[type][this[type][change_index]][bodyparts[1]] < stuff[type][change_to][bodyparts[1]] ) {
                ArmyPage.selects[type][change_index].value = this[type][change_index];
                return false;
            }
        }
        
        //get the original out of the way and refund it
        if(this[type][change_index] != 'None') {
            this.stats = this._stats.sub(stuff[type][this[type][change_index]].stats);
            this[bodyparts[0]] += stuff[type][this[type][change_index]][bodyparts[1]];
            Player.inventory[type][this[type][change_index]] = Player.inventory[type][this[type][change_index]].add(this.size);
        }
        //add in the new one
        this[type][change_index] = change_to;
        this.stats = this._stats.add(stuff[type][this[type][change_index]].stats);
        this[bodyparts[0]] -= stuff[type][this[type][change_index]][bodyparts[1]];

        //maybe display (/ remove tye ones you cannot) just the ones you can use (handcount and the stuff)
        if(change_to != 'None') {
            //if got body part remaining, then open the next list
//!!!CHANGE 1 HERE
            if(change_index < 7 && this[bodyparts[0]] > 0) {
                ArmyPage.selects[type][change_index + 1].parentElement.hidden = false;
            }
            //set new size of the army to if the number of this item is less than the size of the army min(size, number of new item)
            Player.inventory[type][change_to] = Player.inventory[type][change_to].sub(this.size);
            
            if(this.size > Player.inventory[type][change_to]) {
                this.set_size(this.size.add(Player.inventory[type][change_to]));
            }
        }
        //if changed to 'None'
        else {
            let i = change_index;
            //shift the elements to the left by one unit
            while(i < 7 && this[type][i + 1] != 'None') {
                ArmyPage.selects[type][i].innerHTML = this[type][i + 1];                   
                this[type][i] = this[type][i+1];
                this[type][i+1] = 'None';
                i++;
            }
            //hide the next selector
            ArmyPage.selects[type][i].innerHTML = this[type][i];
            ArmyPage.selects[type][i+1].parentElement.hidden = true;
        }
        //if no hands remain, hide last weapon selecter
        if(!this[bodyparts[0]]) {
            for(let i = 0; i < 8; i++) {
                if(this[type][i] == 'None') {
                    ArmyPage.selects[type][i].parentElement.hidden = true;
                    break;
                }
            }
        }
        
    }
    //the thing that needs to be called if you want to change some body-part no questions asked
    change_element_helper_without_visuals(type, change_to, bodyparts = ['hands','hands_needed'], change_index = 0) {
        if(change_to == this[type][change_index]) {
            return;
        }        
        //get the original out of the way and refund it
        if(this[type][change_index] != 'None') {
            this.stats = this._stats.sub(stuff[type][this[type][change_index]].stats);
            this[bodyparts[0]] += stuff[type][this[type][change_index]][bodyparts[1]];
        }
        //add in the new one
        this[type][change_index] = change_to;
        this.stats = this._stats.add(stuff[type][this[type][change_index]].stats);
        this[bodyparts[0]] -= stuff[type][this[type][change_index]][bodyparts[1]];

        //maybe display (/ remove tye ones you cannot) just the ones you can use (handcount and the stuff)
        if(change_to != 'None') {
            if(this._size > Player.inventory[type][change_to]) {
//ONLY WORKING IF YOU DON'T REALLY NEED TO CHANGE ANYTHING, WHEN USING THIS JUST FOR COMPARISONS
                this._size = Player.inventory[type][change_to];
                //this.set_size(this.size.add(Player.inventory[type][change_to]));
            }
        }
    }

    set_size(new_size) {
        //if the creature is 'None', then there can be no army
        if(this.creature == 'None' || new_size.lt(new Decimal(0))) {
            return;
        }
        //calculate the minimun of the elements which are available
        let minn = (new_size.sub(this.size)).min(Player.inventory.creatures[this.creature]);
        let i = 0;
        while(this.weapons[i] != 'None') {
            minn = minn.min(Player.inventory.weapons[this.weapons[i]]);
            i++;
        }
        //set new size
        this.size = minn.add(this.size);
        //set new values for the inventory of items used
        Player.inventory.creatures[this.creature] = Player.inventory.creatures[this.creature].sub(minn);
        i = 0;
        while(this.weapons[i] != 'None') {
            Player.inventory.weapons[this.weapons[i]] = Player.inventory.weapons[this.weapons[i]].sub(minn);
            i++;
        }
        //give visual feedback on what you have here
        
        ArmyPage.armySizeInput.value = StylizeDecimals(this.size,true);
    }

    get_stats() {
        return this.stats.get_text();
    }

    get_change_text(type, change_to, change_index = 0) {
        //if you reset your creature, show this text
        let changed = undefined;
        if(type == 'creatures') {
            if(change_to == 'None') {
                return 'You would dismantle your army with this action.';
            }
            changed = this.creature;
        }
        else {
            changed = this[type][change_index];
        }
        let size = this._size;
        //change element then change it back to view changes
        
        this.change_element(type,change_to,change_index,false);
        const new_army = [this.size,this.stats, this.hands]
        this.change_element(type,changed,change_index,false);
        this._size = size;
        return this.get_compare_text(new_army);
    }

    get_compare_text(new_army) {
        if(!Array.isArray(new_army)) {
            new_army = [new_army.size,new_army.stats,new_army.hands];
        }
        let text = 'Size: ' + StylizeDecimals(this.size, true) + ' → <span style="color:' + UtilityFunctions.get_compare_color(this.size,new_army[0]) + ';">' + StylizeDecimals(new_army[0],true) + '</span><br>';
        text += this.stats.get_compare_text(new_army[1]);
        text += 'Hands: ' + this.hands + ' → <span style="color:' + UtilityFunctions.get_compare_color(this.hands,new_army[2],false) + ';">' + new_army[2] + '</span><br>';
        return text;
    }

    get_body_parts() {
        let text = 'Available hands: ' + this.hands + '<br>';
        return text
    }

    get_text(with_size = false) {
        if(this.creature == 'None') {
            return 'An army without a creature is nothing. You can\'t fight with it, nor do anything with it. Just sayin\'. So please buy some creatures and make an army with them before anything else.';
        }
        let text = '';
        if(with_size == true) {
            text = 'Army size: ' + StylizeDecimals(this.size, true) + '<br>';
        }
        text += this.get_stats() + '<br>';
        text += this.get_body_parts();
        return text;
    }

    save() {
        //  save the components of the army
        //save the creature
        let save_text = this.creature + '/*/';
        //save the weapons
        save_text += this.weapons.length;
        for(let i = 0; i < this.weapons.length; i++) {
            save_text += '/*/' + this.weapons[i];
        }
        //  save the body parts of the army
        //save the hands
        save_text += '/*/' + this.hands;
        //  save the size
        save_text += '/*/' + this._size;
        //save the tower level which this army is raiding
        save_text += '/*/' + this.raiding;
        save_text += '/*/' + this.level + '/*/' + this.level_bonus;
        return save_text;
    }

    load(save_text, i = 0) {
        //split the text by the '/*/'
        if(typeof(save_text) == 'string') {
            save_text = save_text.split('/*/');
        }
        
        //  load the components of the army
        //load the creature
        this.change_element('creatures',save_text[i], 0, false);
        i++;
        let j = new Number(save_text[i]);
        i++;
        let k = 0;
        //load the weapons
        while(j > 0) {
            this.change_element('weapons',save_text[i],k, false)
            j--;
            i++;
            k++;
        }
        //  load the body parts
        //load the number of hands
        this.hands = new Number(save_text[i]);
        i++;
        //  load the size
        this.size = new Decimal(save_text[i]);
        i++;
        this.raiding = Number(save_text[i]);
        i++;
        this.level = Number(save_text[i]);
        i++;
        this.level_bonus = new Decimal(save_text[i]);
        i++;
        return i;
    }
}

const Player = {
    gold : new Decimal(10),
    armies : [new Army(), new Army(), new Army()],
    inventory: {
        creatures : {

        },
        weapons : {

        }
    },
    save() {
        //  save gold
        let save_text = this.gold + '/*/';
        //  save armies
        save_text += this.armies.length;
        for(let i = 0; i < this.armies.length; i++) {
            save_text += '/*/' + this.armies[i].save();
        }
        //save inventory
        save_text += '/*/' + Object.keys(this.inventory).length;
        for(category in this.inventory) {
            save_text += '/*/' + category;
            save_text += '/*/' + Object.keys(this.inventory[category]).length;
            for(item in this.inventory[category]) {
                save_text += '/*/' + item + '/*/' + this.inventory[category][item];
            }
        }
        return save_text
    },
    load(save_text) {
        //split and get ready for loading
        save_text = save_text.split('/*/');
        let i = 0;
        //load gold
        this.gold = new Decimal(save_text[i]);
        i++;
        //load armies
        let j = new Number(save_text[i]);
        i++;
        let k = 0;
        while(j > 0) {
             i = this.armies[k].load(save_text,i);
             k++;
             j--;
        }
        //  load inventory
        //reset inventory
        delete this.inventory;
        this.inventory = {};
        j = new Number(save_text[i]);
        i++;
        while(j > 0) {
            let category = save_text[i];
            i++;
            k = new Number(save_text[i]);
            i++;
            this.inventory[category] = {};
            while(k > 0) {
                this.inventory[category][save_text[i]] = new Decimal(save_text[i+1]);
                i+=2;
                k--;
            }
            j--;
        }
    }
}


//          CREATE TOWER PAGE AND ITS COMPONENTS

class TowerFloor {
    constructor(levels = [], name = '', desc = '', raided_levels = []) {
        this.levels = levels;
        this.name = name;
        this.desc = desc;
        this.raided_levels = raided_levels;
    }

    display(nr_floor) {
        //hide which is not needed, then show which is needed
        let j = TowerPage.Tower.floors[nr_floor].levels.length;
        while(j < TowerPage.towerLevels.length) {
            TowerPage.towerLevels[j].hidden = true;
            j++;
        };
        j = 0;
        while(j < TowerPage.Tower.floors[nr_floor].levels.length) {
            //only show if it is unlocked
            TowerPage.towerLevels[j].hidden = !(IsUnlocked['towerLevels'][nr_floor][j]);
            j++;
        };
        //color by availability and set position
        j = 0;
        while(j < TowerPage.Tower.floors[nr_floor].levels.length) {
            TowerPage.towerLevels[j].style.background = TowerPage.Tower.floors[nr_floor].levels[j].get_color();
            TowerPage.towerLevels[j].style.width = TowerPage.Tower.floors[nr_floor].levels[j].width;
            TowerPage.towerLevels[j].style.height = TowerPage.Tower.floors[nr_floor].levels[j].height;
            TowerPage.towerLevels[j].style.top = TowerPage.Tower.floors[nr_floor].levels[j].top;
            TowerPage.towerLevels[j].style.left = TowerPage.Tower.floors[nr_floor].levels[j].left;
            TowerPage.towerLevels[j].style.zIndex = TowerPage.Tower.floors[nr_floor].levels[j].z_index;
            j++;
        }
        //display floor info
        TowerPage.towerInfo.innerHTML = this.get_text();
    };

    get_text() {
        return '<b>' + this.name + '</b><br>' + 
        '<br><i>' + this.desc + '</i>';
    }

    
};

class ParentTowerLevel {
    constructor(width, height, top, left, z_index, capacity, unlocks, name, desc, raiding_army) {
        this.width = width;
        this.height = height;
        this.top = top;
        this.left = left;
        this.capacity = capacity;
        this.raiding_army = raiding_army;
        this.name = name;
        this.desc = desc;
        this.z_index = z_index;
        this.unlocks = unlocks;
        //it is to prevent trying to unlock multiple times the unlocks
        this.unlocked_next_levels = false;
    }

    display(floor_name, floor_nr, level_nr) {
        TowerPage.towerInfo.innerHTML = this.get_text(floor_name, floor_nr, level_nr);
    }
}

//the level class that makes up the tower floors (a floor consists of one or more levels)
class TowerLevel extends ParentTowerLevel {
    constructor(width, height, top, left, z_index, stats, capacity, gold_per_power, unlocks = [], name = '', desc = '', raiding_army = -1) {
        super(width, height, top, left, z_index, capacity, unlocks, name, desc, raiding_army);

        this.gold_per_power = gold_per_power;
        this.stats = stats;
        this.type = 'Raid';
    }

    get goldPerSecond() {
        return (Player.armies[this.raiding_army].size.min(this.capacity)).mul(this.gold_per_power).mul(Player.armies[this.raiding_army].power);
    }

    get_color() {
        let def_power = this.stats.get_power(Player.armies[TowerPage.currentArmy].stats,'Defense','Attack');
        let atk_power = Player.armies[TowerPage.currentArmy].stats.get_power(this.stats, 'Attack', 'Defense');
        if(atk_power.lt(def_power)) {
            return 'black';
        }
        else {
            return 'burlywood';
        }
    }

    tick(nr_ticks) {
        Player.gold = Player.gold.add(this.goldPerSecond.div(new Decimal(nr_ticks)));
    }

    get_text(floor_name) {
            return '<b>' + floor_name + ' - ' + this.name + '</b><br>' + 
            '<i>Type: ' + this.type + '</i><br>' +
            'Raided by: ' + (this.raiding_army == -1 ? 'None' : this.raiding_army + 1) + '<br>' +
            'Defense: ' + this.stats.Defense.get_text() + '<br>' +
            'Capacity: ' + StylizeDecimals(this.capacity,true) + 
            '<br>' + 'Gold per power: ' + StylizeDecimals(this.gold_per_power) + '<br>' +
            '</br><i>' + this.desc + '</i>';
    }
};

class MinibossLevel extends ParentTowerLevel {
    constructor(width, height, top, left, z_index, boss, capacity, rewards, unlocks = [], name = '', desc = '', raiding_army = -1) {
        super(width, height, top, left, z_index, capacity, unlocks, name, desc, raiding_army);

        this.rewards = rewards;
        this.boss = boss;
        this.type = 'Miniboss';
    }

    get stats() {
        return stuff.bosses[this.boss].stats;
    }

    get_color() {
        let def_power = stuff.bosses[this.boss].stats.get_power(Player.armies[TowerPage.currentArmy].stats,'Defense','Attack');
        let atk_power = Player.armies[TowerPage.currentArmy].stats.get_power(stuff.bosses[this.boss].stats, 'Attack', 'Defense');
        if(atk_power.lt(def_power)) {
            return 'black';
        }
        else {
            return 'burlywood';
        }
    }

    get_text(floor_name) {
        return '<b>' + floor_name + ' - ' + this.name + '</b><br>' + 
        '<i>Type: ' + this.type + '</i><br><br>' + 
        stuff.bosses[this.boss].name + '<br>' + 
        stuff.bosses[this.boss].stats.get_text() + 
        stuff.bosses[this.boss].desc + '<br><br>' + 
        'Capacity:' + StylizeDecimals(this.capacity, true) + 
        this.desc;
    }
}

const TowerPage = {
    towerFloors : [],
    towerLevels : [],
    towerInfo : undefined,
    pageButton : undefined,
    container : undefined,
    changeArmyButtons : undefined,
    currentArmy : 0,
    armyInfo : undefined,
    Tower : {
        floors : [],
        raidedFloors : [],
        currentFloor : 0,
    },
    displayOnLoad() {
        TowerPage.towerFloors[TowerPage.Tower.currentFloor].style.background = 'goldenrod';
        TowerPage.changeArmyButtons[TowerPage.currentArmy].style.borderColor = 'blue';
        TowerPage.changeArmy(TowerPage.currentArmy);
        TowerPage.Tower.floors[TowerPage.Tower.currentFloor].display(TowerPage.Tower.currentFloor);
        //set the context text to the value you need on levels raided
        for(let i = 0; i < TowerPage.Tower.raidedFloors.length; i++) {
            let path = TowerPage.Tower.raidedFloors[i];
            TowerPage.towerLevels[path[1]].setAttribute('contenttext',TowerPage.Tower.floors[path[0]].levels[path[1]].raiding_army + 1);
        }
    },
    display() {
        TowerPage.changeArmy(TowerPage.currentArmy);
    },
    displayEveryTick() {

    },
    changeArmy(change_to) {
        TowerPage.currentArmy = change_to;
        TowerPage.armyInfo.innerHTML = Player.armies[TowerPage.currentArmy].get_text(true);
        TowerPage.Tower.floors[TowerPage.Tower.currentFloor].display(TowerPage.Tower.currentFloor);
    },
    save() {
        //save the current army and Tower
        let save_text = TowerPage.currentArmy + '/*/' + TowerPage.Tower.currentFloor + '/*/';
        //save raided floors and raided levels
        save_text += TowerPage.Tower.raidedFloors.length;
        for(let i = 0; i < TowerPage.Tower.raidedFloors.length; i++) {
            save_text += '/*/' + TowerPage.Tower.raidedFloors[i][0] + '/*/' + TowerPage.Tower.raidedFloors[i][1] + '/*/' + TowerPage.Tower.floors[TowerPage.Tower.raidedFloors[i][0]].levels[TowerPage.Tower.raidedFloors[i][1]].raiding_army;
        }
        return save_text
    },
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = 0;
        TowerPage.currentArmy = Number(save_text[i]);
        i++;
        TowerPage.Tower.currentFloor = Number(save_text[i]);
        i++;
        let len = Number(save_text[i]);
        i++;
        //get raided levels set up
        for(j = 0; j < len; j++) {
            TowerPage.Tower.raidedFloors.push([Number(save_text[i]),Number(save_text[i+1])]);
            TowerPage.Tower.floors[TowerPage.Tower.raidedFloors[j][0]].levels[TowerPage.Tower.raidedFloors[j][1]].raiding_army = Number(save_text[i+2]);
            TowerPage.towerLevels[TowerPage.Tower.raidedFloors[j][1]].innerHTML = Number(save_text[i+2])+1;
            i+=3;
        }
        //display changes with on load function
        TowerPage.displayOnLoad();
    },
};

TowerPage.Tower.floors[0] = new TowerFloor([new TowerLevel(100,50,500,730, 0, new Stats(['Defense'],[new SubStats(new Decimal(1))]), new Decimal(500), new Decimal(0.2), [[0, 1], [0, 2]], 'Sewers 1', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(100,50,449,679, 3, new Stats(['Defense'],[new SubStats(new Decimal(2))]), new Decimal(250), new Decimal(0.3), [[0, 3], [0, 4]], 'Sewers 2', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(100,50,449,781, 3, new Stats(['Defense'],[new SubStats(new Decimal(2))]), new Decimal(250), new Decimal(0.3), [[0, 3], [0, 5]], 'Sewers 3', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(120,50,423,745, 2,new Stats(['Defense'],[new SubStats(new Decimal(3.4))]), new Decimal(450), new Decimal(3), [[0, 6]], 'Sewers 4', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(30,50,385,705, 3, new Stats(['Defense'],[new SubStats(new Decimal(2.5))]), new Decimal(600), new Decimal(1),[[1, 0]], 'Sewers 5', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(30,50,385,859, 3, new Stats(['Defense'],[new SubStats(new Decimal(2.5))]), new Decimal(600), new Decimal(1),[[1, 0]], 'Sewers 6', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(80,50,397,792, 1,new Stats(['Defense'],[new SubStats(new Decimal(7.5))]), new Decimal(900), new Decimal(12),[[0,7]], 'Sewers 7', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(30,70,300,850, 0,new Stats(['Defense'],[new SubStats(new Decimal(15))]), new Decimal(1200), new Decimal(40),[[0,8]], 'Sewers 8', 'Stinky and bad. The first level of the sewers.'),
                                            new MinibossLevel(30,70,250,850, 0,'Slime', new Decimal(1200), new Decimal(40),[], 'Sewer\'s Top', 'The topmost level of the sewers. It is lit with candles. You don\'t want to find out what lurks in the shadows, but will have to do so eventually...'),],
                                        'Sewers', 'Stinky and bad and it gets worse the higher you go.');
TowerPage.Tower.floors[1] = new TowerFloor([new TowerLevel(100,50,300,500, 0, new Stats(['Defense'],[new SubStats(new Decimal(5))]),new Decimal(300),new Decimal(2),[],'The Slums','When you venture beyond the sewers, the place looks like a big slum, full of giant rats.')],'Rat-haven','A place where the rats thrive.')

TowerPage.towerFloors = Array.from(document.querySelectorAll('.tower_part'));
TowerPage.towerLevels = document.querySelectorAll('.tower_level');
TowerPage.pageButton = document.querySelector('#TowerPageButton');
TowerPage.container = document.querySelector('#TowerPageContainer');
TowerPage.changeArmyButtons = document.querySelectorAll('.change_army_button');
TowerPage.armyInfo = document.querySelector('#TowerPageArmyInfo');
TowerPage.towerInfo = document.querySelector('#TowerPageTowerInfo');

//reverse tower levels
let i = 0;
let j = 27;
while(i < j) {
    [TowerPage.towerFloors[i],TowerPage.towerFloors[j]] = [TowerPage.towerFloors[j], TowerPage.towerFloors[i]];
    i++;
    j--;
}

//initialize tower page change army buttons
for(let i = 0; i < TowerPage.changeArmyButtons.length; i++) {
    TowerPage.changeArmyButtons[i].addEventListener('click', () => {
        TowerPage.changeArmyButtons[TowerPage.currentArmy].style.borderColor = 'orangered';
        TowerPage.changeArmy(i);
        TowerPage.changeArmyButtons[TowerPage.currentArmy].style.borderColor = 'blue';
    })
};

//initialize tower floor hover functions
for(let i = 0; i < TowerPage.towerFloors.length; i++) {
    //revert the numbering on the floors because they are in the list in reverse order
    //on mouseenter display new floor
    TowerPage.towerFloors[i].addEventListener('mouseenter', () => {
        if(i >= TowerPage.Tower.floors.length) {
            TowerPage.towerInfo.innerHTML = 'Under developement, sorry. :<)';
        }
        else {
            TowerPage.Tower.floors[i].display(i);
            if(TowerPage.towerFloors[i].style.background != 'goldenrod') {
                TowerPage.towerFloors[i].style.background = 'gold';
            }
        }
    });
    //on mouseleave, revert to current floor
    TowerPage.towerFloors[i].addEventListener('mouseleave', () => {
        TowerPage.Tower.floors[TowerPage.Tower.currentFloor].display(TowerPage.Tower.currentFloor);
        if(TowerPage.towerFloors[i].style.background != 'goldenrod') {
            TowerPage.towerFloors[i].style.background = 'yellow';
        }
        
    });
    //on click change color and currentFloor
    TowerPage.towerFloors[i].addEventListener('click', () => {
        if(i >= TowerPage.Tower.floors.length) {
            return;
        }
        TowerPage.towerFloors[TowerPage.Tower.currentFloor].style.background = 'yellow';
        TowerPage.Tower.currentFloor = i;
        TowerPage.towerFloors[i].style.background = 'goldenrod';
    });
};

//tower level click, enter and leave events and new atribute
for(let i = 0; i < TowerPage.towerLevels.length; i++) {
    //display new level stuff on mouseenter
    TowerPage.towerLevels[i].addEventListener('mouseenter', () => {
        TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].display(TowerPage.Tower.floors[TowerPage.Tower.currentFloor].name);
    });
    //on mouseleave, display current floor
    TowerPage.towerLevels[i].addEventListener('mouseleave', () => {
        TowerPage.towerInfo.innerHTML = TowerPage.Tower.floors[TowerPage.Tower.currentFloor].get_text();
    });
    //on click, change army that is raiding it
    TowerPage.towerLevels[i].addEventListener('click', () => {
        let def_power = TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].stats.get_power(Player.armies[TowerPage.currentArmy].stats,'Defense','Attack');
        let atk_power = Player.armies[TowerPage.currentArmy].stats.get_power(TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].stats, 'Attack', 'Defense');
        if(def_power.lte(atk_power)) {
            //if it is the same army raiding it then to which you are trying to set it, then remove that army
            if(TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].raiding_army == TowerPage.currentArmy) {
                TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].raiding_army = -1;
                TowerPage.towerLevels[i].setAttribute('contenttext','');
                TowerPage.towerLevels[i].innerHTML = '';
                Player.armies[TowerPage.currentArmy].raiding = -1;
                //remove the problematic element from the end of the array which stores the raided places
                for(j = 0; j < TowerPage.Tower.raidedFloors.length; j++) {
                    if(TowerPage.Tower.raidedFloors[j][0] == TowerPage.Tower.currentFloor && TowerPage.Tower.raidedFloors[j][1] == i) {
                        TowerPage.Tower.raidedFloors.splice(j,1);
                        break;
                    }
                }
            }
            else {
                //if this army was occupied, remove previous raid
                if(Player.armies[TowerPage.currentArmy].raiding != -1) {
                    for(j = 0; j < TowerPage.Tower.raidedFloors.length; j++) {
                        if(TowerPage.Tower.floors[TowerPage.Tower.raidedFloors[j][0]].levels[TowerPage.Tower.raidedFloors[j][1]].raiding_army == TowerPage.currentArmy)  {
                            if(TowerPage.Tower.raidedFloors[j][0] == TowerPage.Tower.currentFloor) {
                                TowerPage.towerLevels[Player.armies[TowerPage.currentArmy].raiding].setAttribute('contenttext','');
                                TowerPage.towerLevels[Player.armies[TowerPage.currentArmy].raiding].innerHTML = '';
                            }
                            TowerPage.Tower.raidedFloors.splice(j,1);
                            break;
                        }
                    }
                    TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[Player.armies[TowerPage.currentArmy].raiding].raiding_army = -1;
                }
                //if the level is already raided, remove it
                if(TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].raiding_army != -1) {
                    for(j = 0; j < TowerPage.Tower.raidedFloors.length; j++) {
                        if(TowerPage.Tower.raidedFloors[j][0] == TowerPage.Tower.currentFloor && TowerPage.Tower.raidedFloors[j][1] == i) {
                            TowerPage.Tower.raidedFloors.splice(j,1);
                            break;
                        }
                    }
                    Player.armies[TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].raiding_army].raiding = -1;
                    TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].raiding_army = -1;
                }
                TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].raiding_army = TowerPage.currentArmy;
                contenttext = String(TowerPage.currentArmy + 1);
                Player.armies[TowerPage.currentArmy].raiding = i;
                TowerPage.towerLevels[i].setAttribute('contenttext',contenttext);
                TowerPage.towerLevels[i].innerHTML = contenttext;
                TowerPage.Tower.raidedFloors.push([TowerPage.Tower.currentFloor,i]);
            }
            //unlock new levels
            if(!TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].unlocked_next_levels) {
                for(let j = 0; j < TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].unlocks.length; j++) {
                    let un = TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].unlocks[j];
                    Unlockables.unlock(['towerLevels',un[0]] , 0, un[1]);
                    if(un[0] == TowerPage.Tower.currentFloor) {
                        TowerPage.towerLevels[un[1]].hidden = false;
                    }
                    
                }
                TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].unlocked_next_levels = true;
            }
        }
    });
    TowerPage.towerLevels[i].setAttribute('contenttext','');
};


//          CREATE ARMY PAGE AND ITS COMPONENTS
const ArmyPage = {
    pageButton : undefined,
    container : undefined,
    selects: {
        creatures : [],
        weapons : undefined,
    },
    info : undefined,
    partInfo : undefined,
    armySizeInput : undefined,
    currentArmy : 0,
    changeArmyButtons : [],
    maxArmySizeButton : undefined,
    //a collection to help you get the number of some select button faster
    nameToButtonNumber : {
        creatures : {
            'None': 0, 'Human' : 1,
        },
        weapons : {
            'None' : 0, 'Knife' : 1, 'Dagger' : 2, 'Longsword' : 3,
        },
    },
    selectButtons : {
        creatures : [],
        weapons : [],
    },
    currentSelecting : {
        weapons : undefined,
    },
    levelText : undefined,
    levelUpButton : undefined,
    levelUpCost : undefined,
    displayOnLoad() {
        ArmyPage.changeArmyButtons[ArmyPage.currentArmy].style.borderColor = 'blue';
        ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
        ArmyPage.armySizeInput.value = StylizeDecimals(Player.armies[ArmyPage.currentArmy].size,true);
    },
    display() {
        ArmyPage.changeArmy(ArmyPage.currentArmy);
    },
    displayEveryTick() {
        ArmyPage.selects.creatures[0].nextElementSibling.innerHTML = (Player.armies[ArmyPage.currentArmy].creature == 'None'  ? '(∞)' : '(' + StylizeDecimals(Player.inventory.creatures[Player.armies[ArmyPage.currentArmy].creature],true) + ')');
        for(i = 0; i < 8; i++) {
            ArmyPage.selects.weapons[i].nextElementSibling.innerHTML = (Player.armies[ArmyPage.currentArmy].weapons[i] == 'None' ? '(∞)' : '(' + StylizeDecimals(Player.inventory.weapons[Player.armies[ArmyPage.currentArmy].weapons[i]],true) + ')');
        }
    },
    changeArmy(change_to) {
        //          hide all the selectors
        ArmyPage.selectButtons.creatures[0].parentElement.hidden = true;
        ArmyPage.selectButtons.weapons[0].parentElement.hidden = true;
        //          reset(show selectButtons and set selects to None) in the army used 'till now
        //reset creature which was used
        ArmyPage.selects.creatures[0].innerHTML = Player.armies[change_to].creature;
        if(Player.armies[ArmyPage.currentArmy].creature != 'None') {
            ArmyPage.selectButtons.creatures[ArmyPage.nameToButtonNumber.creatures[Player.armies[ArmyPage.currentArmy].creature]].hidden = false;
        }
        let k = 0;
        //show previous army weapons and reset weapon selects if they where used
        while(k < 8 && Player.armies[ArmyPage.currentArmy].weapons[k] != 'None') {
            ArmyPage.selectButtons.weapons[ArmyPage.nameToButtonNumber.weapons[Player.armies[ArmyPage.currentArmy].weapons[k]]].hidden = false;
            ArmyPage.selects.weapons[k].innerHTML = 'None';
            k++;
        }
        //          set new selects and hide selectButtons used
        k = 0;
        ArmyPage.currentArmy = change_to;
        //hide current used creature
        if(Player.armies[ArmyPage.currentArmy].creature != 'None') {
            ArmyPage.selectButtons.creatures[ArmyPage.nameToButtonNumber.creatures[Player.armies[ArmyPage.currentArmy].creature]].hidden = true;
        }
        //hide current weapons, set setters' innerHTML value
        while(k < 8 && Player.armies[ArmyPage.currentArmy].weapons[k] != 'None') {
            ArmyPage.selectButtons.weapons[ArmyPage.nameToButtonNumber.weapons[Player.armies[ArmyPage.currentArmy].weapons[k]]].hidden = true;
            ArmyPage.selects.weapons[k].parentElement.hidden = false;
            ArmyPage.selects.weapons[k].innerHTML = Player.armies[ArmyPage.currentArmy].weapons[k];
            k++;
        }
        //          show next selector if possible and needed
        //set the next weapon selector visible if needed and possible
        if(Player.armies[change_to].hands > 0 && k < 8 && Player.armies[ArmyPage.currentArmy].creature != "None") {
            ArmyPage.selects.weapons[k].parentElement.hidden = false;
            k++;
        }
        //          hide unused selectors
        //hide unused weapon selectors
        while(k < 8) {
            ArmyPage.selects.weapons[k].parentElement.hidden = true;
            k++;
        }
        //          set the info and other stuff
        ArmyPage.info.innerHTML = Player.armies[change_to].get_text();
        ArmyPage.armySizeInput.value = StylizeDecimals(Player.armies[change_to].size, true);
        if(Player.armies[ArmyPage.currentArmy].level < Army.level_prices.length) {
            ArmyPage.levelUpCost.innerHTML = 'Cost: ' +  StylizeDecimals(Army.level_prices[Player.armies[ArmyPage.currentArmy].level]);
            ArmyPage.levelText.innerHTML = 'Level: ' + (Player.armies[ArmyPage.currentArmy].level+1);
        }
        else {
            ArmyPage.levelText.innerHTML = 'Level: Max';
            ArmyPage.levelText.hidden = true;
        }
    },
    save() {
        let save_text;
        //save current army
        save_text = ArmyPage.currentArmy+ '/*/';
        return save_text;
    },
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = 0;
        //reset color before doing anything else
        ArmyPage.changeArmyButtons[ArmyPage.currentArmy].style.borderColor = 'orangered';
        ArmyPage.currentArmy = Number(save_text[i]);
        i++;
        let type, j;
        //load all the select buttons
        for(type in Player.inventory) {
            for(j = 0; j < ArmyPage.selectButtons[type].length; j++) {
                //if there is none in the inventory, hide it, else, show it
                if(Player.inventory[type][ArmyPage.selectButtons[type][j].innerHTML] == undefined && ArmyPage.selectButtons[type][j].innerHTML != 'None') {
                    ArmyPage.selectButtons[type][j].hidden = true;
                }
                else {
                    ArmyPage.selectButtons[type][j].hidden = false;
                }
            }
        }
        ArmyPage.displayOnLoad();
    },
}

ArmyPage.pageButton = document.querySelector('#ArmyPageButton');
ArmyPage.container = document.querySelector('#ArmyPageContainer');
ArmyPage.selects.creatures.push(document.querySelector('#CreatureSelect'));
ArmyPage.selects.weapons = document.querySelectorAll('.weapon_select');
ArmyPage.info = document.querySelector('#ArmyPageInfo');
ArmyPage.armySizeInput = document.querySelector('#ArmySizeInput');
ArmyPage.changeArmyButtons = document.querySelectorAll('.select_army_button');
ArmyPage.maxArmySizeButton = document.querySelector('#MaxArmySize');
ArmyPage.selectButtons.creatures = document.querySelectorAll('.creature_select_button');
ArmyPage.selectButtons.weapons = document.querySelectorAll('.weapon_select_button');
ArmyPage.partInfo = document.querySelector('#ArmyPagePartInfo');
ArmyPage.levelText = document.querySelector('#ArmyLevelText');
ArmyPage.levelUpButton = document.querySelector('#ArmyLevelUpButton');
ArmyPage.levelUpCost = document.querySelector('#ArmyLevelUpCost');

//initialize changeArmyButton's click function
for(let i = 0; i < ArmyPage.changeArmyButtons.length; i++) {
    ArmyPage.changeArmyButtons[i].addEventListener('click', () => {
        ArmyPage.changeArmyButtons[ArmyPage.currentArmy].style.borderColor = 'orangered';
        ArmyPage.changeArmy(i);
        ArmyPage.changeArmyButtons[ArmyPage.currentArmy].style.borderColor = 'blue';
    });
}

//initialize all select's, selectButtons parent's and selectButtons' mouse functions
for(let type in ArmyPage.selects) {
    if(type == 'creatures') {
        //select click
        ArmyPage.selects.creatures[0].addEventListener('click', function() {
            if(ArmyPage.selectButtons.creatures[0].parentElement.hidden) {
                ArmyPage.selects.creatures[0].innerHTML = 'Selecting...';
                ArmyPage.selectButtons.creatures[0].parentElement.hidden = false;
            }
            else {
                ArmyPage.selects.creatures[0].innerHTML = Player.armies[ArmyPage.currentArmy].creature;
                ArmyPage.selectButtons.creatures[0].parentElement.hidden = true;
            }
        });
        //selects' parent mouseenter and mouseleave
        ArmyPage.selects.creatures[0].parentElement.addEventListener('mouseenter', function() {
            ArmyPage.partInfo.hidden = false;
            ArmyPage.partInfo.innerHTML = stuff.creatures[Player.armies[ArmyPage.currentArmy].creature].get_text();
        });
        ArmyPage.selects.creatures[0].parentElement.addEventListener('mouseleave', function() {
            ArmyPage.partInfo.hidden = true;
        });
        //selectButton click, mouseenter and mouseleave
        for(let i = 0; i < ArmyPage.selectButtons.creatures.length; i++) {
            ArmyPage.selectButtons.creatures[i].addEventListener('click', () => {
                if(ArmyPage.selects.creatures[0].innerHTML != 'None') {
                    //if the previous select wasn't None, show it again
                    ArmyPage.selectButtons.creatures[ArmyPage.nameToButtonNumber.creatures[Player.armies[ArmyPage.currentArmy].creature]].hidden = false;
                }
                //change the creature
                Player.armies[ArmyPage.currentArmy].change_element('creatures',ArmyPage.selectButtons.creatures[i].innerHTML);
                //display change on info text and on select
                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
                ArmyPage.selects.creatures[0].innerHTML = ArmyPage.selectButtons.creatures[i].innerHTML;
                //after selecting, hide select buttons
                ArmyPage.selectButtons.creatures[i].parentElement.hidden = true;
                //if the selected thing is not None, then hide it to not show anymore
                if(ArmyPage.selects.creatures[0].innerHTML != 'None') {
                    ArmyPage.selectButtons.creatures[i].hidden = true;
                }
            });
            ArmyPage.selectButtons.creatures[i].addEventListener('mouseenter', function() {
                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_change_text('creatures',ArmyPage.selectButtons.creatures[i].innerHTML, false);
                //show info text for the changed part
                ArmyPage.partInfo.hidden = false;
                ArmyPage.partInfo.innerHTML = stuff.creatures[Player.armies[ArmyPage.currentArmy].creature].get_compare_text(stuff.creatures[ArmyPage.selectButtons.creatures[i].innerHTML])
            });
            ArmyPage.selectButtons.creatures[i].addEventListener('mouseleave', function() {
                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
                //hide info text of the changing part
                ArmyPage.partInfo.hidden = true;
            });
        }
    }
    else {
        //selects and their parents
        for(let i = 0; i < 8; i++) {
            //select click
            ArmyPage.selects[type][i].addEventListener('click', function() {
                //if there is no selection going on
                if(ArmyPage.selectButtons[type][i].parentElement.hidden) {
                    //set text and show the selector buttons
                    ArmyPage.selects[type][i].innerHTML = 'Selecting...';
                    ArmyPage.selects[type][i].parentElement.nextElementSibling.parentNode.insertBefore(ArmyPage.selectButtons[type][i].parentElement, ArmyPage.selects[type][i].parentElement.nextElementSibling);
                    ArmyPage.selectButtons[type][i].parentElement.hidden = false;
                    ArmyPage.currentSelecting[type] = i;
                }
                //if there is selection going on
                else {
                    //if it is the same as clicked on, then just hide the thing
                    if(i == ArmyPage.currentSelecting[type]) {
                        ArmyPage.selects[type][i].innerHTML = Player.armies[ArmyPage.currentArmy][type][i];
                        ArmyPage.selectButtons[type][i].parentElement.hidden = true;
                        ArmyPage.currentSelecting[type] = undefined;
                    }
                    else {
                        //reset text of the other one
                        ArmyPage.selects[type][ArmyPage.currentSelecting[type]].innerHTML = Player.armies[ArmyPage.currentArmy][type][ArmyPage.currentSelecting[type]];
                        ArmyPage.selects[type][i].parentElement.nextElementSibling.parentNode.insertBefore(ArmyPage.selectButtons[type][i].parentElement, ArmyPage.selects[type][i].parentElement.nextElementSibling);
                        ArmyPage.currentSelecting[type] = i;
                        ArmyPage.selects[type][i].innerHTML = 'Selecting...';
                    }
                }
            });
            //selects' parent mouseenter and mouseleave
            ArmyPage.selects[type][i].parentElement.addEventListener('mouseenter', function() {
                ArmyPage.partInfo.hidden = false;
                ArmyPage.partInfo.innerHTML = stuff[type][Player.armies[ArmyPage.currentArmy][type][i]].get_text();
            });
            ArmyPage.selects[type][i].parentElement.addEventListener('mouseleave', function() {
                ArmyPage.partInfo.hidden = true;
            });
        }
        //selectButton click, mouseenter and mouseleave
        for(let j = 0; j < ArmyPage.selectButtons[type].length; j++) {
            ArmyPage.selectButtons[type][j].addEventListener('click', () => {
                //if the previous select wasn't None, show it again
                if(ArmyPage.selects[type][ArmyPage.currentSelecting[type]].innerHTML != 'None') {
                    ArmyPage.selectButtons[type][ArmyPage.nameToButtonNumber[type][Player.armies[ArmyPage.currentArmy][type][ArmyPage.currentSelecting[type]]]].hidden = false;
                }
                ArmyPage.selects[type][ArmyPage.currentSelecting[type]].innerHTML = ArmyPage.selectButtons[type][j].innerHTML;
                Player.armies[ArmyPage.currentArmy].change_element(type,ArmyPage.selectButtons[type][j].innerHTML, ArmyPage.currentSelecting[type]);
                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
                //after selecting, hide select buttons
                ArmyPage.selectButtons[type][j].parentElement.hidden = true;
                //if the selected thing is not None, then hide it to not show anymore
                if(ArmyPage.selectButtons[type][j].innerHTML != 'None') {
                    ArmyPage.selectButtons[type][j].hidden = true;
                }
            });
            ArmyPage.selectButtons[type][j].addEventListener('mouseenter', function() {
                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_change_text(type,ArmyPage.selectButtons[type][j].innerHTML, ArmyPage.currentSelecting[type]);
                //show info text for the changed part
                ArmyPage.partInfo.hidden = false;
                ArmyPage.partInfo.innerHTML = stuff[type][Player.armies[ArmyPage.currentArmy][type][ArmyPage.currentSelecting[type]]].get_compare_text(stuff[type][ArmyPage.selectButtons[type][j].innerHTML]);
            });
            ArmyPage.selectButtons[type][j].addEventListener('mouseleave', function() {
                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
                //hide info text of the changing part
                ArmyPage.partInfo.hidden = true;
            });
        
        };
    }
}

//army size buttons click functions
ArmyPage.armySizeInput.addEventListener('change', () => {
    Player.armies[ArmyPage.currentArmy].set_size(new Decimal(ArmyPage.armySizeInput.value));
});
ArmyPage.maxArmySizeButton.addEventListener('click', () => {
    Player.armies[ArmyPage.currentArmy].set_size(new Decimal(Infinity));
});

ArmyPage.levelUpButton.addEventListener('mouseenter', function() {
    if(Player.armies[ArmyPage.currentArmy].level < Army.level_prices.length) {
        ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_level_up_text();
    ArmyPage.partInfo.hidden = false;
    ArmyPage.partInfo.innerHTML = Player.armies[ArmyPage.currentArmy].get_compare_level_text();
    ArmyPage.levelText.innerHTML = 'Level: ' + (Player.armies[ArmyPage.currentArmy].level+1) + ' → <span style="color:' + UtilityFunctions.get_compare_color(Player.armies[ArmyPage.currentArmy].level, Player.armies[ArmyPage.currentArmy].level + 1, false) + '">' +(Player.armies[ArmyPage.currentArmy].level + 2) + '</span><br>';
    }
});

ArmyPage.levelUpButton.addEventListener('mouseleave', function() {
    ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
    ArmyPage.levelText.innerHTML = 'Level: ' + (Player.armies[ArmyPage.currentArmy].level+1);
    ArmyPage.partInfo.hidden = true;
});

ArmyPage.levelUpButton.addEventListener('click', function() {
    Player.armies[ArmyPage.currentArmy].level_up();
    ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
    
    ArmyPage.partInfo.hidden = true;
    if(Player.armies[ArmyPage.currentArmy].level < Army.level_prices.length) {
        ArmyPage.levelUpCost.innerHTML = 'Cost: ' +  StylizeDecimals(Army.level_prices[Player.armies[ArmyPage.currentArmy].level]);
        ArmyPage.levelText.innerHTML = 'Level: ' + (Player.armies[ArmyPage.currentArmy].level+1);
    }
    else {
        ArmyPage.levelText.innerHTML = 'Level: Max';
        ArmyPage.levelText.hidden = true;
    }
});


//          BUY CREATURE PAGE
class Buyer {
    borderColors = {
        'gold' : 'gold',
    };

    constructor(type, name, currency = 'gold', nr_bought = new Decimal(0)) {
        this.type = type;
        this.name = name;
        this.nr_bought = nr_bought;
        this.currency = currency;
    }

    buy(buy_nr) {
        let price = stuff[this.type][this.name].get_price(this.nr_bought, buy_nr);
        if(Player[this.currency].gte(price)) {
            Player[this.currency] = Player[this.currency].sub(price);
            if(!Player.inventory[this.type][this.name]) {
                ArmyPage.selectButtons[this.type][ArmyPage.nameToButtonNumber[this.type][this.name]].hidden = false;
                Player.inventory[this.type][this.name] = new Decimal(0);
            }
            Player.inventory[this.type][this.name] = Player.inventory[this.type][this.name].add(buy_nr);
            this.nr_bought = this.nr_bought.add(buy_nr);
            Unlockables.unlock(['buyer',this.name],this.nr_bought);
            return true;
        }
        return false;
    }

    get_price(buy_nr) {
        return stuff[this.type][this.name].get_price(this.nr_bought, buy_nr);
    }
}

const BuyCreaturePage = {
    pageButton : undefined,
    container : undefined,
    buyButtons : [],
    buyers : [new Buyer('creatures','Human')],
    buyNumberButtons : [],
    buyNumberValues : [new Decimal(1),new Decimal(10),new Decimal(100),new Decimal(1000)],
    currentBuyNumberButton : 0,
    infoText : undefined,
    displayOnLoad() {
        BuyCreaturePage.buyNumberButtons[BuyCreaturePage.currentBuyNumberButton].style.borderColor = 'blue';
    },
    display() {
        for(let j = 0; j < BuyCreaturePage.buyers.length; j++) {
            if(!BuyCreaturePage.buyButtons[j].parentElement.hidden) {
                BuyCreaturePage.buyButtons[j].innerHTML = 'Buy: ' + StylizeDecimals(BuyCreaturePage.buyers[j].get_price(BuyCreaturePage.buyNumberValues[BuyCreaturePage.currentBuyNumberButton]), true);
            }
        }
    },
    displayEveryTick() {
        for(let i = 0; i < BuyCreaturePage.buyButtons.length; i++) {
            if(!BuyCreaturePage.buyButtons[i].parentElement.hidden) {
                let name = BuyCreaturePage.buyers[i].name;
                BuyCreaturePage.buyButtons[i].nextElementSibling.innerHTML = (Player.inventory.creatures[name] ? '(' + StylizeDecimals(Player.inventory.creatures[name],true) + ')' : '(0)');
            }
        }
        
    },
    save() {
        let save_text = BuyCreaturePage.currentBuyNumberButton + '/*/' + BuyCreaturePage.buyButtons.length;

        for(let i = 0; i < BuyCreaturePage.buyButtons.length; i++) {
            save_text += '/*/' + BuyCreaturePage.buyers[i].nr_bought;
        }
        return save_text;
    },
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = 0;
        BuyCreaturePage.currentBuyNumberButton = Number(save_text[i]);
        i++;
        let len = Number(save_text[i]);
        i++;
        for(let j = 0; j < len; j++) {
            BuyCreaturePage.buyers[j].nr_bought = new Decimal(save_text[i]);
            i++;
        }
        BuyCreaturePage.displayOnLoad();
    },
}

BuyCreaturePage.pageButton = document.querySelector('#BuyCreaturePageButton');
BuyCreaturePage.container = document.querySelector('#BuyCreaturePageContainer');
BuyCreaturePage.buyButtons = document.querySelectorAll(".buy_creature");
BuyCreaturePage.buyNumberButtons = document.querySelectorAll(".creature_buy_number");
BuyCreaturePage.infoText = document.querySelector('#BuyCreaturePageInfo');
//initialize creature buyer's mouse envents
for(let i = 0; i < BuyCreaturePage.buyers.length; i++) {
    BuyCreaturePage.buyButtons[i].addEventListener('click',  () => {
        if(BuyCreaturePage.buyers[i].buy(BuyCreaturePage.buyNumberValues[BuyCreaturePage.currentBuyNumberButton])) {
            BuyCreaturePage.display();
        }
    });
}
//mouse events for the buy creature's buyer divs
for(let i = 0; i < BuyCreaturePage.buyers.length; i++) {
    BuyCreaturePage.buyButtons[i].parentElement.addEventListener('mouseenter',  () => {
        BuyCreaturePage.infoText.hidden = false;
        BuyCreaturePage.infoText.innerHTML = stuff['creatures'][BuyCreaturePage.buyers[i].name].get_text();
    });
    BuyCreaturePage.buyButtons[i].parentElement.addEventListener('mouseleave',  () => {
        BuyCreaturePage.infoText.hidden = true;
    });
}
//click functions for the buy creature number toggles
for(let i = 0; i < BuyCreaturePage.buyNumberButtons.length; i++) {
    BuyCreaturePage.buyNumberButtons[i].addEventListener('click',  () => {
        if(BuyCreaturePage.currentBuyNumberButton != i) {
            BuyCreaturePage.buyNumberButtons[i].style.borderColor = 'blue';
            BuyCreaturePage.buyNumberButtons[BuyCreaturePage.currentBuyNumberButton].style.borderColor = 'orangered';
            BuyCreaturePage.currentBuyNumberButton = i;
            BuyCreaturePage.display();
        }
        
    });
}




//          BUY WEAPON PAGE
const BuyWeaponPage = {
    pageButton : undefined,
    container : undefined,
    buyButtons : [],
    buyers : [new Buyer('weapons','Knife'), new Buyer('weapons','Dagger'),new Buyer('weapons','Longsword')],
    buyNumberButtons : [],
    buyNumberValues : [new Decimal(1),new Decimal(10),new Decimal(100),new Decimal(1000)],
    currentBuyNumberButton : 0,
    infoText : undefined,
    displayOnLoad() {
        BuyWeaponPage.buyNumberButtons[BuyWeaponPage.currentBuyNumberButton].style.borderColor = 'blue';
    },
    display() {
        for(let j = 0; j < BuyWeaponPage.buyers.length; j++) {
            if(!BuyWeaponPage.buyButtons[j].parentElement.hidden) {
                BuyWeaponPage.buyButtons[j].innerHTML = 'Buy: ' + StylizeDecimals(BuyWeaponPage.buyers[j].get_price(BuyWeaponPage.buyNumberValues[BuyWeaponPage.currentBuyNumberButton]),true);
            }
        }
    },
    displayEveryTick() {
        for(let i = 0; i < BuyWeaponPage.buyButtons.length; i++) {
            if(!BuyWeaponPage.buyButtons[i].parentElement.hidden) {
                let name = BuyWeaponPage.buyers[i].name;
                BuyWeaponPage.buyButtons[i].nextElementSibling.innerHTML = (Player.inventory.weapons[name] ? '(' + StylizeDecimals(Player.inventory.weapons[name],true) + ')' : '(0)');
            }
        }
    },
    save() {
        let save_text = BuyWeaponPage.currentBuyNumberButton + '/*/' + BuyWeaponPage.buyButtons.length;

        for(let i = 0; i < BuyWeaponPage.buyButtons.length; i++) {
            save_text += '/*/' + BuyWeaponPage.buyers[i].nr_bought;
        }
        return save_text;
    },
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = 0;
        BuyWeaponPage.currentBuyNumberButton = Number(save_text[i]);
        i++;
        let len = Number(save_text[i]);
        i++;
        for(let j = 0; j < len; j++) {
            BuyWeaponPage.buyers[j].nr_bought = new Decimal(save_text[i]);
            i++;
        }
        BuyWeaponPage.displayOnLoad();
    },
}

BuyWeaponPage.pageButton = document.querySelector('#BuyWeaponPageButton');
BuyWeaponPage.container = document.querySelector('#BuyWeaponPageContainer');
BuyWeaponPage.buyButtons = document.querySelectorAll(".buy_weapon");
BuyWeaponPage.buyNumberButtons = document.querySelectorAll(".weapon_buy_number");
BuyWeaponPage.infoText = document.querySelector('#BuyWeaponPageInfo');
//initialize weapon buyer mouse envets
for(let i = 0; i < BuyWeaponPage.buyers.length; i++) {
    BuyWeaponPage.buyButtons[i].addEventListener('click',  () => {
        //if make a succeful purchase
        if(BuyWeaponPage.buyers[i].buy(BuyWeaponPage.buyNumberValues[BuyWeaponPage.currentBuyNumberButton])) {
            BuyWeaponPage.display();
        }
    });
}
//mouse events for the buy weapon's buyer divs
for(let i = 0; i < BuyWeaponPage.buyers.length; i++) {
    BuyWeaponPage.buyButtons[i].parentElement.addEventListener('mouseenter',  () => {
        BuyWeaponPage.infoText.hidden = false;
        BuyWeaponPage.infoText.innerHTML = stuff['weapons'][BuyWeaponPage.buyers[i].name].get_text();
    });
    BuyWeaponPage.buyButtons[i].parentElement.addEventListener('mouseleave',  () => {
        BuyWeaponPage.infoText.hidden = true;
    });
}
//click functions for the buy creature number toggles
for(let i = 0; i < BuyWeaponPage.buyNumberButtons.length; i++) {
    BuyWeaponPage.buyNumberButtons[i].addEventListener('click',  () => {
        if(BuyWeaponPage.currentBuyNumberButton != i) {
            BuyWeaponPage.buyNumberButtons[i].style.borderColor = 'blue';
            BuyWeaponPage.buyNumberButtons[BuyWeaponPage.currentBuyNumberButton].style.borderColor = 'orangered';
            BuyWeaponPage.currentBuyNumberButton = i;
            BuyWeaponPage.display();
        }
        
    });
}


//          SETTINGS PAGE
const downloadToFile = (content, filename = 'GameSave', contentType = 'text/plain') => {
    const a = document.createElement('a');
    const file = new Blob([content], {type: contentType});
    
    a.href= URL.createObjectURL(file);
    a.download = filename;
    a.click();
  
    URL.revokeObjectURL(a.href);
};

const SettingsPage = {
    pageButton : undefined,
    container : undefined,
    saveGameButton : undefined,
    loadGameButton : undefined,
    display() {

    },
    displayEveryTick() {

    },
    displayOnLoad() {

    },
    save() {

    },
    load(save_text) {

    },
    
}

SettingsPage.pageButton = document.getElementById('SettingsPageButton');
SettingsPage.container = document.getElementById('SettingsPageContainer');
SettingsPage.saveGameButton = document.getElementById('SaveGameButton');
SettingsPage.loadGameButton = document.getElementById('LoadGameButton');

//page separator: '*/*'
//Save your game to file
SettingsPage.saveGameButton.addEventListener('click', () => {
    let save_text = Player.save();
    for(let i = 0; i < pages.length; i++) {
        save_text += '*/*' + pages[i].save();
    }
    save_text += '*/*' + Unlockables.save();
    save_text += '*/*' + String(currentPage);
    save_text += '*/*' + Date.now();
    downloadToFile(save_text);
});

//Load in your game from file
SettingsPage.loadGameButton.addEventListener('input', () => {
    if(SettingsPage.loadGameButton.files.length) {
        let file_reader = new FileReader();
        file_reader.onload = () => {
            let save_text = file_reader.result;
            save_text = save_text.split('*/*');
            let i = 0;
            Player.load(save_text[i]);
            i++;
            Unlockables.load(save_text[i]);
            i++;
            for(let j = 0; j < pages.length; j++, i++) {
                pages[j].load(save_text[i]);
            }
            HidePages(Number(save_text[i]));
            i++;
            LoadOfflineProgress(Date.now() - Number(save_text[i]));
            i++;
        };
        
        
        file_reader.readAsText(SettingsPage.loadGameButton.files[0]);
    }
});


//          ALL THE PAGES IN ONE PLACE

const body = document.getElementById('body');

const pages = [TowerPage,ArmyPage, BuyCreaturePage, BuyWeaponPage, SettingsPage];
const page_names = ['TowerPage', 'ArmyPage', 'BuyCreaturePage', 'BuyWeaponPage', 'SettingsPage'];

//Hide all unnecessary pages at startup
for(let i = 0; i < pages.length ; i++) {
    pages[i].container.hidden = true;
}

for(let i = 0; i < pages.length; i++) {
    pages[i].pageButton.addEventListener('click',  () => {
        HidePages(i);
    });
}

UnlockedStuff = {
    pages : {
        tower_page : [TowerPage.pageButton],
        army_page : [ArmyPage.pageButton, ArmyPage.levelUpButton],
        buy_weapon_page : [BuyWeaponPage.pageButton, BuyWeaponPage.buyButtons[1].parentElement],
    },
}

IsUnlocked = {
    //the pages 
    pages : {
        tower_page : [0],
        army_page : [0, 0],
        buy_weapon_page : [0, 0],
    },
    towerLevels : {
        0 : [1, 0, 0, 0, 0, 0, 0,],
        1 : [0],
    },
    tower : {
        floors : [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    save() {
        save_text = 'towerLevels';
        let i;
        for(let cat in this.towerLevels) {
            save_text += '/*/' + cat + '/*/' + this.towerLevels[cat].length;
            for(i = 0; i < this.towerLevels[cat].length; i++) {
                save_text += '/*/' + this.towerLevels[cat][i];
            }
        }
        return save_text;
    },
    //gets savetext without 'towerLevels'
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = 0, cat, len, j;
        while(i < save_text.length) {
            cat = Number(save_text[i]);
            i++;
            len = Number(save_text[i]);
            i++;
            for(j = 0; j < len; j++,i++) {
                if(cat == 0 && j == 0) {
                    continue;
                }
                if(Number(save_text[i]) == 1) {
                    Unlockables.towerLevels[cat][j].unlock_stuff();
                }
                else {
                    Unlockables.towerLevels[cat][j].lock_stuff();
                }
                
            }
        }
        
    }
}

class Unlock {
    constructor(type = 'quantity', price = new Decimal(1), isVisible = false, path = ['none','none',0, 'none','none',1]) {
        this.type = type;
        this.price = price;
        this.isVisible = isVisible;
        this.path = path;
    }

    can_unlock(value) {
        switch(this.type) {
            case 'quantity':
                if(this.price.lte(value)) {
                    return true;
                }
                return false;
            case 'unlock' :
                let sum = 0;
                for(let i = 1; i < this.price.length; i+=3) {
                    sum += IsUnlocked[this.price[i]][this.price[i+1]][this.price[i+2]];
                }
                if(sum >= this.price[0]) {
                    return true;
                }
                return false;
        }
    }

    unlock_stuff() {
        if(IsUnlocked[this.path[0]][this.path[1]][this.path[2]]) {
            return;
        }
        if(Array.isArray(this.isVisible)) {
            let i;
            for(i = 0; i < this.isVisible.length; i++) {
                IsUnlocked[this.path[i*3]][this.path[i*3 + 1]][this.path[i*3 + 2]] = 1;
                if(this.isVisible[i]) {
                    UnlockedStuff[this.path[i*3]][this.path[i*3 + 1]][this.path[i*3 + 2]].hidden = false;
                }
            }
        }
        else {
            IsUnlocked[this.path[0]][this.path[1]][this.path[2]] = 1;
            if(this.isVisible) {
                UnlockedStuff[this.path[0]][this.path[1]][this.path[2]].hidden = false;
            }
        }
        
    }

    lock_stuff() {
        if(!IsUnlocked[this.path[0]][this.path[1]][this.path[2]]) {
            return;
        }
        if(Array.isArray(this.isVisible)) {
            let i;
            for(i = 0; i < this.isVisible.length; i++) {
                IsUnlocked[this.path[i*3]][this.path[i*3 + 1]][this.path[i*3 + 2]] = 0;
                if(this.isVisible[i]) {
                    UnlockedStuff[this.path[i*3]][this.path[i*3 + 1]][this.path[i*3 + 2]].hidden = true;
                }
            }
        }
        else {
            IsUnlocked[this.path[0]][this.path[1]][this.path[2]] = 0;
        }
        if(this.isVisible) {
            UnlockedStuff[this.path[0]][this.path[1]][this.path[2]].hidden = true;
        }
    }
}

//a system for unlocking everything you need
Unlockables = {
    buyer : {
        'Human' : [new Unlock('quantity', new Decimal(1), true, ['pages','army_page',0])],
    },
    army : {
        'power' : [new Unlock('quantity', new Decimal(1), [true, true], ['pages','buy_weapon_page',0,'pages','tower_page',0])],
        'size' : [],
    },
    towerLevels : {
        0 : [0, new Unlock('unlock',[1, 'towerLevels', 0, 0], [false, true], ['towerLevels', 0, 1,'pages','army_page',1]), new Unlock('unlock',[1, 'towerLevels', 0, 0] , false, ['towerLevels', 0, 2]), 
                new Unlock('unlock',[1, 'towerLevels', 0, 1, 'towerLevels', 0, 2], false, ['towerLevels', 0, 3]), 
                new Unlock('unlock',[1, 'towerLevels', 0, 1] , false, ['towerLevels', 0, 4]), new Unlock('unlock',[1, 'towerLevels', 0, 2] , false, ['towerLevels', 0, 5]),
                new Unlock('unlock',[1, 'towerLevels', 0, 3] , [false, true], ['towerLevels', 0, 6, 'pages','buy_weapon_page',1]), new Unlock('unlock',[1, 'towerLevels', 0, 6] , false, ['towerLevels', 0, 7]),
                new Unlock('unlock',[1, 'towerLevels', 0, 6] , false, ['towerLevels', 0, 8])],
        1 : [new Unlock('unlock',[1, 'towerLevels', 0, 4, 'towerLevels', 0, 5], false, ['towerLevels', 1, 0]),],
    },
    //THINKING NEEDED
    tower : {
        'floors' : [0, 1,]
    },
    unlockNow : {
        buyer : {
            'Human' : 0,
        },
        army : {
            'power' : 0,
            'size' : 0,
        }
    },
    //control unlock function; tries to unlock stuff if it is unlockable
    unlock(path = ["none","none"], value = new Decimal(0), unlock_nr = undefined) {
        unlock_nr = unlock_nr == undefined ? this.unlockNow[path[0]][path[1]] : unlock_nr;
        if(this[path[0]][path[1]] == undefined) {
            return;
        }
        while(unlock_nr < this[path[0]][path[1]].length && this[path[0]][path[1]][unlock_nr].can_unlock(value)) {
            this[path[0]][path[1]][unlock_nr].unlock_stuff();
            unlock_nr++;
            if(this.unlockNow[path[0]] == undefined || this.unlockNow[path[0]][path[1]] == undefined) {
                break;
            }
        }
        if(this.unlockNow[path[0]] != undefined && this.unlockNow[path[0]][path[1]] != undefined) {
            this.unlockNow[path[0]][path[1]] = unlock_nr;
        }
        
    },
    ///used to save unlocked and unlock now part
    save() {
        let save_text = '';
        //save unlockNow
        let cat, i, type;
        for( cat in Unlockables.unlockNow) {
            for( type in Unlockables.unlockNow[cat]) {
                save_text += cat + '/*/' + type + '/*/' + Unlockables.unlockNow[cat][type] + '/*/';
            }
        }
        //save tower levels
        save_text += IsUnlocked.save();
        return save_text;
    },
    //load save text, where there are visible differences, unlock/lock content
    load(save_text) {
        save_text = save_text.split('/*/towerLevels/*/');
        IsUnlocked.load(save_text[1]);
        save_text = save_text[0].split('/*/');
        let i = 0, len, type, name, j;
        //load unlockNow and everything that is unlocked as of yet
        while(i < save_text.length) {
            type = save_text[i];
            name = save_text[i+1];
            len =  Number(save_text[i+2]);
            //unlock stuff 
            for(j = 0; j < len; j++) {
                Unlockables[type][name][j].unlock_stuff();
            }
            while(j < Unlockables[type][name].length && Unlockables[type][name]) {
                Unlockables[type][name][j].lock_stuff();
                j++;
            }
            Unlockables.unlockNow[type][name] = len;
            i += 3;
        }
        i++;
    },
};

var currentPage = 0;

let interval = setInterval(TowerPage.displayEveryTick,50);

function HidePages(toShow) {
    if(toShow != currentPage) {
        clearInterval(interval);
        pages[currentPage].container.hidden = true;
        pages[toShow].container.hidden = false;
        currentPage = toShow;
        interval = setInterval(pages[currentPage].displayEveryTick,50);
        pages[toShow].display();
    }
}
//          THE INTERPAGE STUFF         \\
const goldText = document.querySelector('#GoldText');

//a function to handle offline progress
function LoadOfflineProgress(nr_miliseconds = 0, current_page) {
    let load_text = 'Here\'s what your servants did in your absence:<br>';
    let nr_seconds = new Decimal(nr_miliseconds/1000);
    //calculate gold per second
    let gold_per_second = new Decimal(0);
    for(i = 0; i < TowerPage.Tower.raidedFloors.length; i++) {
        gold_per_second = gold_per_second.add(TowerPage.Tower.floors[TowerPage.Tower.raidedFloors[i][0]].levels[TowerPage.Tower.raidedFloors[i][1]].goldPerSecond);
    }
    //handle gold
    let total_gold = gold_per_second.mul(nr_seconds);
    load_text += '&nbsp&nbsp&nbsp&nbsp<span style="color:gold">Gold: ' + StylizeDecimals(total_gold) + '</span>';
    Player.gold = Player.gold.add(total_gold);

    //display offline load text
    document.getElementById('OfflineInfoText').innerHTML = load_text;
    //click event for the continue from offline button
    document.getElementById('ContinueFromOfflineProgress').addEventListener('click', function() {
        //change current page to be able to use HidePages
        currentPage = current_page ? 0 : 1;
        document.getElementById('OfflinePageContainer').hidden = true;
        document.getElementById('PageButtonsContainer').hidden = false;
        goldText.parentElement.hidden = false;
        HidePages(current_page);
    });
}

//a function to save game to local storage
function SaveToLocalStorage() {
    const local_storage = window.localStorage;
    local_storage.clear();
    local_storage.setItem('Player',Player.save());
    for(let i = 0; i < pages.length; i++) {
        let text = pages[i].save();
        local_storage.setItem(page_names[i],text);
    }
    local_storage.setItem('Unlockables',Unlockables.save());
    local_storage.setItem('currentPage',String(currentPage));
    local_storage.setItem('lastSavedTime',Date.now());
}

//a function to load game from local storage
function LoadFromLocalStorage() {
    const local_storage = window.localStorage;
    Unlockables.load(local_storage.getItem('Unlockables'));
    Player.load(local_storage.getItem('Player'));
    for(let i = 0; i < pages.length; i++) {
        pages[i].load(local_storage.getItem(page_names[i]));
    }
    //load offline progress
    let a = Number(local_storage.getItem('currentPage'));
    //hide stuff to show a proper offline load page
    document.getElementById('PageButtonsContainer').hidden = true;
    goldText.parentElement.hidden = true;
    LoadOfflineProgress(Date.now() - Number(local_storage.getItem('lastSavedTime')), a);
}

function OpenGame() {
    if(window.localStorage.length != 0) {
        LoadFromLocalStorage();
    }
    else {
        document.getElementById("OfflinePageContainer").hidden = true;
        HidePages(2);
        pages[currentPage].displayOnLoad();
        SaveToLocalStorage();
    }
}

function CloseGame() {
    SaveToLocalStorage();
}

//load the game on each session when starting up
window.addEventListener('load', () => {OpenGame()});
//save game whenever you switch tabs in browser (close, refresh, go to new/other tab)
document.addEventListener('visibilitychange', SaveToLocalStorage);
//save the game before closing
window.addEventListener('beforeunload', () => {CloseGame()});

//setInterval(SaveToLocalStorage,1000);

function tick() {
    goldText.innerHTML = StylizeDecimals(Player.gold);
    for(i = 0; i < TowerPage.Tower.raidedFloors.length; i++) {
        TowerPage.Tower.floors[TowerPage.Tower.raidedFloors[i][0]].levels[TowerPage.Tower.raidedFloors[i][1]].tick(20);
    }
}

setInterval(tick,50);