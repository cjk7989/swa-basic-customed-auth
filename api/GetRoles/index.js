const fetch = require('node-fetch').default;

// add role names to this object to map them to group ids in your AAD tenant
const roleGroupMappings = {
    'admin': '8977106e-d27a-440c-872f-f16484384a49',
    'reader': 'c479b57c-870b-436a-b27c-662a083146ad'
};

module.exports = async function (context, req) {
    const user = req.body || {};
    const roles = [];
    
    for (const [role, groupId] of Object.entries(roleGroupMappings)) {
        if (await isUserInGroup(groupId, user.accessToken, context)) {
            roles.push(role);
        }
    }

    context.res.json({
        roles
    });
}

async function isUserInGroup(groupId, bearerToken, context) {
    const url = new URL('https://graph.microsoft.com/v1.0/me/memberOf');
    url.searchParams.append('$filter', `id eq '${groupId}'`);
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${bearerToken}`
        },
    });

    if (response.status !== 200) {
        const responsebody = await response.json();
        context.log.error('Failed to query graph.microsoft.com with http status code', response.status, 'and message:', JSON.stringify(responsebody.error.message));
        return false;
    }

    const graphResponse = await response.json();
    const matchingGroups = graphResponse.value.filter(group => group.id === groupId);
    return matchingGroups.length > 0;
}
