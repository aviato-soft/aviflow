const dataCards = [
    {
        title: "Simple usage",
        action: `<button 
    data-action="fetch" 
    data-url="https://jsonplaceholder.typicode.com/posts" 
    data-target="#target-simple"
    data-param-title="foo"
    data-param-body="bar"
    >Click to Fetch</button>`,
        targetId: "target-simple",
        usageNote: `The way it is used most of the time. <br>
    Mandatory: <strong>data-action=fetch</strong>.<br>
    Usual <strong>data-url</strong> and <strong>data-param-*</strong> is provided.`
    },
    {
        title: "Anchor Trigger as Button",
        action: `<a 
    data-action="fetch" 
    href="https://jsonplaceholder.typicode.com/posts"
    data-target="#target-anchor"
    data-param-title="foo"
    data-param-body="bar"
    >Fetch via Anchor</a>`,
        targetId: "target-anchor",
        usageNote: `Similar with <strong>Simple Example</strong>, but using <strong>a</strong> tag for trigger instead of a button.<br>Using <strong>href</strong> for anchor elements will made obsolete the <strong>data-url</strong> attribute.`
    },
    {
        title: "Minimalist",
        action: `<button 
    data-action="fetch"
    data-target="#target-minimalist"
    data-url='data:application/json;charset=utf-8,{"success":true,"html":"<p>okay!</p>"}'
    >Click to Fetch</button>`,
        targetId: "target-minimalist",
        usageNote: `Minimal mandatory attributes:<ul>
    <li><strong>data-action=fetch</strong> - required for initialization</li>
    <li><strong>data-action=target</strong> - in this case used as working example, it is optional.Success handling function can do the default trarget job.</li>
    <li><strong>data-action=url</strong> - in this case we use a test string to get a result. If missing default value  <strong>#</strong> is used</li>`
    },
/*
    {
        title: "Multiple Params",
        action: `<button 
    data-action="fetch" 
    data-method="GET" 
    data-url="https://jsonplaceholder.typicode.com/users?_id={{userId}}" 
    data-param-userId="1">GET User #1 (Button)</button>`,
        targetId: "case03-target",
        usageNote: "Multiple <strong>data-param-</strong> attributes collected into FormData. Also demonstrates <strong>data-method=GET</strong> with a custom URL template."
    },
    {
        title: "Multiple Targets",
        action: `<button 
    data-action="fetch" 
    data-url="https://jsonplaceholder.typicode.com/users/1" 
    data-target="#case04-target-1">Render User Profile</button>`,
        targetId: 'case04-target',
        //      targetIds: ["case04-target-1", "case04-target-2"],
        usageNote: "Each trigger has its own <strong>data-target=\"#...\"</strong> pointing to a different container. One click handles two independent fetches."
    },
    {
        title: "All Parameters Used",
        action: `<button 
    data-action="fetch" 
    data-url="https://jsonplaceholder.typicode.com/users/1" 
    data-method="POST" 
    data-param-ajax="true" 
    data-param-testing-params="This is test param 1" 
    data-param-testingParams="Test param 2" 
    data-param-x="1" 
    data-param-y="2" 
    data-param-z="3" 
    data-state-pending="Fetching..." 
    data-on-success="avi.onSuccess" 
    data-on-error="avi.onError" 
    data-target="#case05-target"
    >POST with Params &amp; Callbacks</button>`,
        targetId: "case05-target",
        usageNote: "Demonstrates every supported attribute: <strong>data-action</strong>, <strong>data-url</strong>, <strong>data-method</strong>, multiple <strong>data-param-</strong>,<br /><strong>data-state-pending</strong>, and custom callbacks <strong>data-on-success</strong> / <strong>data-on-error</strong>."
    }
*/
];