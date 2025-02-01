# M3 - Requirements and Design

## 1. Change History
<!-- Leave blank for M3 -->

## 2. Project Description
FoodTrip is an android app that helps users explore global cuisines by planning a virtual food trip. Users can choose a starting and ending country, and the app will generate a travel route with recipes from different locations along the way. It also creates a smart grocery list which can be used to optimize ingredient reuse and allow users to see local store discounts. Additionally, FoodTrip allows dietary preference customization and social media sharing, so users can tailor their meals to their needs and share their journeys with friends.


## 3. Requirements Specification
### **3.1. Use-Case Diagram**
![Use-Case Diagram](images/use-case-diagram.png)


### **3.2. Actors Description**
1. **Application User**: An actor who interacts with the app to create food trips, manage grocery lists, and share their journey on social media. Users can set dietary preferences and explore different cuisines.
2. **Grocery Store**: An actor that can provide information about item availability, offer discounts, and notify users of out-of-stock ingredients.


### **3.3. Functional Requirements**
<a name="fr1"></a>

1. **Manage food trip** 
    - **Overview**:
        1. Select a starting country and an ending country.
        2. Set the number of locations to explore.
        3. Set dietary preferences and restrictions.
        4. Generate a travel route with associated recipes.
    
    - **Detailed Flow for Each Independent Scenario**: 
        1. **Creating a food trip**:
            - **Description**: The user inputs a start and end country, along with preferences.
            - **Primary actor(s)**: App user.
            - **Main success scenario**:
                1. User selects starting and ending countries.
                2. User sets the number of location and dietary preferences.
                3. The app generates a realistic route with recipes from each country.
                4. The trip is displayed on a map with recipe pins.
            - **Failure scenario(s)**:
                - 1a. No valid route exists.
                    - 1a1. Notify user and suggest other options.
                - 1b. No recipes match the dietary restrictions.
                    - 1b1. Ask user to relax restrictions or modify selection.
    
2. **Manage Grocery List** 
    - **Overview**:
        1. Generate a list of required ingredients for the trip.
        2. Optimize for ingredient reuse to reduce costs.
        3. Display available discounts from partner grocery stores.
        4. Let users know about out-of-stock items and offer other options.
    
    - **Detailed Flow for Each Independent Scenario**: 
        1. **Generating a Grocery List**:
            - **Description**: The app creates a shopping list based on recipes.
            - **Primary actor(s)**: App user and grocery store.
            - **Main success scenario**:
                1. The app finds required ingredients from selected recipes.
                2. It checks for reusable ingredients across multiple recipes.
                3. The grocery list is created and shown to the user.
            - **Failure scenario(s)**:
                - 1a. Some ingredients are not available.
                    - 1a1. Let user know and suggest replacement options.

3. **Share on Social Media** 
    - **Overview**:
        1. Users can share their food trip and recipes.
        2. View other users' trips.
    
    - **Detailed Flow for Each Independent Scenario**: 
        1. **Sharing a Trip**:
            - **Description**: Users post their completed food trips on social media.
            - **Primary actor(s)**: App user. 
            - **Main success scenario**:
                1. User selects a completed trip.
                2. The app generates a post with trip details and photos.
                3. User shares on selected platforms (Facebook, Instagram, etc.).
            - **Failure scenario(s)**:
                - 1a. No internet connection.
                    - 1a1. Let user know and allow retry later.


### **3.4. Screen Mockups**
Not necessary to explain our requirements.


### **3.5. Non-Functional Requirements**
<a name="nfr1"></a>

1. **Efficient performance**
    - **Description**: The system should generate food trips and grocery lists in under 10 seconds.
    - **Justification**: Helps to ensure a good user experience without long loading times.
2. **Security and privacy**
    - **Description**: User data such as dietary preferences and grocery lists should be securely stored and only accessible from an authenticated account.
    - **Justification**: Helps build user trust and ensures data protection.


## 4. Designs Specification
### **4.1. Main Components**
1. **[Virtual Route Manager]**
    - **Purpose**: Manages the virtual trip by allowing it to convert the coordinates given into a list of recipes which are returned to the user. Designed to handle all the logic and API calls required to create a virtual trip
    - **Interfaces**: 
        1. ...
            - **Purpose**: ...
        2. ...
2. **[]**
    - **Purpose**: ...
    - **Interfaces**: 
        1. ...
            - **Purpose**: ...
        2. ...
3. **[WRITE_NAME_HERE]**
    - **Purpose**: ...
    - **Interfaces**: 
        1. ...
            - **Purpose**: ...
        2. ...
4. **[WRITE_NAME_HERE]**
    - **Purpose**: ...
    - **Interfaces**: 
        1. ...
            - **Purpose**: ...
        2. ...


### **4.2. Databases**
1. **[Trips]**
    - **Purpose**: Stores all trips for a given user and the recipes used in that trip
2. ...


### **4.3. External Modules**
1. **[Edamam API]** 
    - **Purpose**: Used to lookup recipes. Chosen for its ability to lookup 2.3 million recipes and 30 day free trial, as well as being utilized in other similar use cases requiring recipe lookup
2. **[Google Maps]** 
    - **Purpose**: Used for creating virtual trips and planning local grocery trips. Chosen for its popularity and abundant support/documentation
3. **[Meta API]** 
    - **Purpose**: Used to share recipes used in a virtual trip, the route taken in a virtual trip, or pictures of the food that users have made to a Meta platform(Facebook, Instagram, WhatsApp, etc.)


### **4.4. Frameworks**
1. **AWS**
    - **Purpose**: EC2 Instance
    - **Reason**: ...
2. **MongoDB**
    - **Purpose**: User Database
    - **Reason**: All members have experience with MongoDB and it is a permitted framework


### **4.5. Dependencies Diagram**


### **4.6. Functional Requirements Sequence Diagram**
1. [**[WRITE_NAME_HERE]**](#fr1)\
[SEQUENCE_DIAGRAM_HERE]
2. ...


### **4.7. Non-Functional Requirements Design**
1. [**[WRITE_NAME_HERE]**](#nfr1)
    - **Validation**: ...
2. ...


### **4.8. Main Project Complexity Design**
**[Convert_Virtual_Trip]**
- **Description**: Converts a virtual trip from google maps into a list of ingredients. Formally, it takes a pair of coordinates and finds a combination of transportation methods between those points via google maps. Must be able to associate the path travelled to certain ethnic foods, then search for recipes for said food through edamam API, finally returning a series of recipes that an individual may reasonably find if they were to actually travel between the two inputs points. A dish would be considered reasonable if the region associated with it is within a certain distance of a virtual path between the points as given by google maps. The user may specify dietary restrictions and the number of subcultures within a given country, which would be relevant as it may arbitrarily restrict the recipes that are associated with the selected virtual path
- **Why complex?**: Since users are expected to travel across multiple countries, many different paths could be taken depending on the forms of transportation available, meaning that there are many different viable virtual paths. For any given virtual path, the algorithm must be able to determine what recipes are associated with that path, and then find a combination of recipes that satisfies the number of dishes per country whilst obeying user dietary restrictions
- **Design**:
    - **Input**: a pair of points, number of stops per country, number of subcultures per country, dietary restrictions
    - **Output**: a list of recipes associated with the virtual path between input points
    - **Main computational logic**: ...
    - **Pseudo-code**: ...
        ```
        attempted_paths = 0
        viable_routes = []
        recipes = []
        countries = []
        while (attemptedpaths < attempt_limit) // to prevent insane delays from trying every possible path
            route = call_mapsAPI(firstpoint_lat, firstpoint_long, secondpoint_lat, secondpoint_long)
            countries = find_countries_from_route(route)
            for country in countries
                potential_recipes = find_recipes_for_country(route,country)
                remove_violating_recipes(potential_recipes, dietary_restrictions)
                if potential_recipes.length < stops_per_country
                    continue // try another path
                selected_recipes = select_recipes(potential_recipes, stops_per_country, subcultures_per_country)
                recipes.add(selected_recipes)
                viable_routes.add(route)
            attemptedpaths++
        return(recipes,viable_routes)
        ```


## 5. Contributions
- ...
- ...
- ...
- ...
