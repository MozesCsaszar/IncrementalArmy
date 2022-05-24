# IncrementalArmy

This is an incremental game where you can build and customize an army to raid the misterious Tower, where all kinds of monsters dwell.

## Tutorial

### Creature Page

Here you can buy creatures for your army. Each row consists of a single creature, the fields from left to right are:
number of the creature already owned in parantheses, name of the creature, price of the creature. To buy a creature, please click the Buy button.

On the right side of this panel is a text field which describes details about the creature which's row the cursor is above.

The boxes containing I, X, C and M are used to set the number of creatures to buy (1, 10, 100 and 1000 repsectively) with one click of the respective Buy button.

### Army Page

This is the page where you can customize your armies, represented by the three buttons Army 1, 2 and 3 repsectively.

Each army has different fields which can be changed, starting from Creature, then several Weapon slots. To change a component of the army, click on the button next to the component you want to change and select an item form the list that appears underneath it. Note that the available number of each respective component is on the left side of its name. Note that changing a component might reduce the army size.

Next to this filed is a text which details the current stats of your army. When hovering over a component change option, the changes to the army will be displayed here. The changes to the respective component can be found next to this text filed, under the 'Level' word.

To the right of the green bar, the size of the army can be set (each unit of size will consume one of each component selected in the current army).

Under this field is the level up area, which will increase the strength of the army by a multiplier.

Note that because prices are rounded down, it might happen that having the perfect amount of gold and trying to buy a creature does nothing ( the price of the creature is more than 5, but it is lost when rounding).

### Tower Page

This is the area where the armies can be sent into the tower to fight for gold and items.

On the left side of the window, the buttons 1, 2, 3 are used to change the currently selected army. Under these is the description of the army selected.

Next to this field is a description of the currently selected floor of the Tower or the Level you are howering.

The big yellow column is the Tower, by clicking on one of the elements, you can change the currently viewed floor.

Next to the tower is the Level selection area. Here you can click on one of the boxes to send your armies there to fight. If the box is light brown in color, it is available (the attacking power of the army is greater or equal to the defending power of the Level). Note that gold gain is on a per army size per power basis, so if the size of the army is 0, no gold production will happen. The Level info consists of the following: Tower Floor - Level name, Type (only Raid is implemented), the army that is currently occupying this Level, the defense of the Level, capacity, meaning the maximum number of units for which gold can be gained, gold per power, which is how much gold the tower yields per total power of attacking army (obtained by multiplying power of a unit by size of army) and a short comment on the Level.

### Settings Page

The game can be saved into a file by pushing the Save game button, or loaded by pressing the Choose File button and then choosing a local file obtained by previously saving the game.
